import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { AegisToken, AegisTimelock, AegisGovernor, AegisTreasury } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AegisDAO Governance Ecosystem", function () {
  let token: AegisToken;
  let timelock: AegisTimelock;
  let governor: AegisGovernor;
  let treasury: AegisTreasury;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;

  const minDelay = 1; // 1 second
  const votingDelay = 1; // 1 block
  const votingPeriod = 5; // 5 blocks
  const proposalThreshold = ethers.parseEther("100");
  const quorumPercentage = 4; // 4%

  beforeEach(async function () {
    [owner, voter1, voter2, recipient] = await ethers.getSigners();

    // 1. Deploy Token
    const TokenFactory = await ethers.getContractFactory("AegisToken");
    token = (await TokenFactory.deploy(owner.address)) as AegisToken;

    // Transfer tokens & delegate voting power (Quorum is 4% of 10M = 400,000 AGIS)
    await token.transfer(voter1.address, ethers.parseEther("500000"));
    await token.transfer(voter2.address, ethers.parseEther("50000"));

    await token.connect(voter1).delegate(voter1.address);
    await token.connect(voter2).delegate(voter2.address);

    // 2. Deploy Timelock
    const TimelockFactory = await ethers.getContractFactory("AegisTimelock");
    timelock = (await TimelockFactory.deploy(
      minDelay,
      [],
      [ethers.ZeroAddress],
      owner.address
    )) as AegisTimelock;

    // 3. Deploy Governor
    const GovernorFactory = await ethers.getContractFactory("AegisGovernor");
    governor = (await GovernorFactory.deploy(
      await token.getAddress(),
      await timelock.getAddress(),
      votingDelay,
      votingPeriod,
      proposalThreshold,
      quorumPercentage,
      owner.address // Use owner as the trusted oracle for testing
    )) as AegisGovernor;

    // 4. Deploy Treasury
    const TreasuryFactory = await ethers.getContractFactory("AegisTreasury");
    treasury = (await TreasuryFactory.deploy(await timelock.getAddress())) as AegisTreasury;

    // Fund Treasury
    await owner.sendTransaction({
      to: await treasury.getAddress(),
      value: ethers.parseEther("10"),
    });

    // Configure Timelock roles
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress());
    await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
  });

  it("Should have correct initial token balances and voting power", async function () {
    expect(await token.balanceOf(voter1.address)).to.equal(ethers.parseEther("500000"));
    expect(await token.getVotes(voter1.address)).to.equal(ethers.parseEther("500000"));
  });

  it("Should allow voter1 to create a proposal to release a treasury grant", async function () {
    const grantAmount = ethers.parseEther("1");
    const transferCalldata = treasury.interface.encodeFunctionData("releaseGrant", [
      recipient.address,
      grantAmount,
      "Development Grant #1",
    ]);

    const targets = [await treasury.getAddress()];
    const values = [0];
    const calldatas = [transferCalldata];
    const title = "Proposal #1: Release 1 ETH Grant to Recipient";
    const ipfsHash = "QmTestHash123";
    const safetyScore = 15;

    // Simulate Oracle Signature
    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "uint256", "string", "uint8"],
      [title, grantAmount, ipfsHash, safetyScore]
    );
    // Note: getBytes correctly prepares the hash string to be signed as bytes
    const signature = await owner.signMessage(ethers.getBytes(messageHash));

    const tx = await governor.connect(voter1).proposeWithAttestation(
      targets, values, calldatas, title,
      title, grantAmount, ipfsHash, safetyScore, signature
    );
    const receipt = await tx.wait();

    // Verify proposal ID generated
    const descriptionHash = ethers.id(title);
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

    expect(await governor.state(proposalId)).to.equal(0); // 0 = Pending
  });

  it("Should execute proposal workflow: Propose -> Vote -> Queue -> Execute", async function () {
    const grantAmount = ethers.parseEther("1");
    const transferCalldata = treasury.interface.encodeFunctionData("releaseGrant", [
      recipient.address,
      grantAmount,
      "Community Grant",
    ]);

    const targets = [await treasury.getAddress()];
    const values = [0];
    const calldatas = [transferCalldata];
    const title = "Proposal #2: Community Grant Execution";
    const descriptionHash = ethers.id(title);
    const ipfsHash = "QmTestHash456";
    const safetyScore = 12;

    // Simulate Oracle Signature
    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "uint256", "string", "uint8"],
      [title, grantAmount, ipfsHash, safetyScore]
    );
    const signature = await owner.signMessage(ethers.getBytes(messageHash));

    // Propose
    await governor.connect(voter1).proposeWithAttestation(
      targets, values, calldatas, title,
      title, grantAmount, ipfsHash, safetyScore, signature
    );
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

    // Mine blocks to reach Active state (votingDelay = 1 block)
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    expect(await governor.state(proposalId)).to.equal(1); // 1 = Active

    // Vote (1 = For)
    await governor.connect(voter1).castVote(proposalId, 1);
    await governor.connect(voter2).castVote(proposalId, 1);

    // Mine blocks past voting period
    for (let i = 0; i < votingPeriod; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    expect(await governor.state(proposalId)).to.equal(4); // 4 = Succeeded

    // Queue proposal
    await governor.queue(targets, values, calldatas, descriptionHash);
    expect(await governor.state(proposalId)).to.equal(5); // 5 = Queued

    // Increase time to pass timelock delay
    await ethers.provider.send("evm_increaseTime", [minDelay + 1]);
    await ethers.provider.send("evm_mine", []);

    // Execute proposal
    const balanceBefore = await ethers.provider.getBalance(recipient.address);
    await governor.execute(targets, values, calldatas, descriptionHash);
    const balanceAfter = await ethers.provider.getBalance(recipient.address);

    expect(balanceAfter - balanceBefore).to.equal(grantAmount);
    expect(await governor.state(proposalId)).to.equal(7); // 7 = Executed
  });
});
