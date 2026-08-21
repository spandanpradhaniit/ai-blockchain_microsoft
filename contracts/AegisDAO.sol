// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── OpenZeppelin v5 Imports ─────────────────────────────────────────
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ═════════════════════════════════════════════════════════════════════
//  AegisToken — ERC20Votes Governance Token
// ═════════════════════════════════════════════════════════════════════

/**
 * @title AegisToken
 * @dev Governance token with ERC20Votes capability for snapshot-based voting & delegation.
 */
contract AegisToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18; // 10 Million AGIS

    constructor(address initialOwner)
        ERC20("Aegis DAO Token", "AGIS")
        ERC20Permit("Aegis DAO Token")
        Ownable(initialOwner)
    {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public view override(ERC20Permit, Nonces) returns (uint256)
    {
        return super.nonces(owner);
    }
}

// ═════════════════════════════════════════════════════════════════════
//  AegisTimelock — TimelockController
// ═════════════════════════════════════════════════════════════════════

/**
 * @title AegisTimelock
 * @dev Enforces execution delay and proposer/executor access controls for governance proposals.
 */
contract AegisTimelock is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}

// ═════════════════════════════════════════════════════════════════════
//  AegisGovernor — Governor with ECDSA Oracle Attestation
// ═════════════════════════════════════════════════════════════════════

/**
 * @title AegisGovernor
 * @dev OpenZeppelin v5 Governor with cryptographically authenticated AI risk scores.
 *
 * TRUST MODEL — ORACLE SIGNATURE VERIFICATION
 * =============================================
 * Every proposal submitted via `proposeWithAttestation` carries an AI safety score
 * that is cryptographically signed by a trusted backend oracle. The contract
 * recovers the signer via ECDSA.recover and reverts unless it matches the
 * stored `riskOracle` address.
 *
 * The signed message is:
 *   keccak256(abi.encodePacked(title, amount, ipfsHash, safetyScore))
 *
 * The oracle signs this hash using EIP-191 "Ethereum Signed Message" prefix so
 * that `ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(hash), sig)` matches.
 *
 * ⚠  PRODUCTION DISCLAIMER: This reference implementation uses a single EOA oracle
 *    key.  For a real deployment, replace the single-key oracle with:
 *      • A multi-sig oracle committee (e.g. Safe / Gnosis multisig as oracle)
 *      • Chainlink Functions or another decentralized oracle network
 *      • A threshold-signature scheme (TSS) with key-shares across operators
 *    The `setRiskOracle` function supports key rotation by the Governor's executor
 *    (Timelock), so migration to a committee address is a governance proposal away.
 */
contract AegisGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ─── Oracle Trust State ──────────────────────────────────────────────
    address public riskOracle;

    event ProposalAttested(
        uint256 indexed proposalId,
        string  title,
        uint256 amount,
        string  ipfsHash,
        uint8   safetyScore,
        address oracleSigner
    );

    event RiskOracleUpdated(address indexed oldOracle, address indexed newOracle);

    error InvalidOracleSignature();
    error ZeroAddressOracle();

    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint48 _initialVotingDelay,
        uint32 _initialVotingPeriod,
        uint256 _initialProposalThreshold,
        uint256 _quorumPercentage,
        address _riskOracle
    )
        Governor("AegisDAO Governor")
        GovernorSettings(_initialVotingDelay, _initialVotingPeriod, _initialProposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {
        if (_riskOracle == address(0)) revert ZeroAddressOracle();
        riskOracle = _riskOracle;
    }

    function setRiskOracle(address _newOracle) external onlyGovernance {
        if (_newOracle == address(0)) revert ZeroAddressOracle();
        address old = riskOracle;
        riskOracle = _newOracle;
        emit RiskOracleUpdated(old, _newOracle);
    }

    function proposeWithAttestation(
        address[] memory targets,
        uint256[] memory values,
        bytes[]   memory calldatas,
        string    memory description,
        string    memory title,
        uint256          amount,
        string    memory ipfsHash,
        uint8            safetyScore,
        bytes     memory oracleSignature
    ) external returns (uint256) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(title, amount, ipfsHash, safetyScore)
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(oracleSignature);

        if (recovered != riskOracle) revert InvalidOracleSignature();

        uint256 proposalId = propose(targets, values, calldatas, description);

        emit ProposalAttested(proposalId, title, amount, ipfsHash, safetyScore, recovered);

        return proposalId;
    }

    // ─── Required Overrides ─────────────────────────────────────────────

    function votingDelay()
        public view override(Governor, GovernorSettings) returns (uint256)
    { return super.votingDelay(); }

    function votingPeriod()
        public view override(Governor, GovernorSettings) returns (uint256)
    { return super.votingPeriod(); }

    function quorum(uint256 timepoint)
        public view override(Governor, GovernorVotesQuorumFraction) returns (uint256)
    { return super.quorum(timepoint); }

    function state(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl) returns (ProposalState)
    { return super.state(proposalId); }

    function proposalNeedsQueuing(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl) returns (bool)
    { return super.proposalNeedsQueuing(proposalId); }

    function proposalThreshold()
        public view override(Governor, GovernorSettings) returns (uint256)
    { return super.proposalThreshold(); }

    function _queueOperations(
        uint256 proposalId, address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId, address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal view override(Governor, GovernorTimelockControl) returns (address)
    { return super._executor(); }
}

// ═════════════════════════════════════════════════════════════════════
//  AegisTreasury — Managed DAO Vault
// ═════════════════════════════════════════════════════════════════════

/**
 * @title AegisTreasury
 * @dev Managed DAO treasury contract owned by the Timelock.
 */
contract AegisTreasury is Ownable, ReentrancyGuard {
    event GrantReleased(address indexed recipient, uint256 amount, string reason);
    event ParameterUpdated(bytes32 indexed key, uint256 value);
    event EmergencyPauseToggled(bool isPaused);

    bool public isPaused;
    mapping(bytes32 => uint256) public systemParameters;

    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {}

    modifier whenNotPaused() {
        require(!isPaused, "AegisTreasury: System is emergency paused");
        _;
    }

    function releaseGrant(address payable recipient, uint256 amount, string memory reason)
        external onlyOwner nonReentrant whenNotPaused
    {
        require(recipient != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient treasury balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
        emit GrantReleased(recipient, amount, reason);
    }

    function updateParameter(bytes32 key, uint256 value) external onlyOwner {
        systemParameters[key] = value;
        emit ParameterUpdated(key, value);
    }

    function setEmergencyPause(bool _paused) external onlyOwner {
        isPaused = _paused;
        emit EmergencyPauseToggled(_paused);
    }
}

// ═════════════════════════════════════════════════════════════════════
//  AegisDAO — Monolithic AI-Assisted Governance & Risk Engine
// ═════════════════════════════════════════════════════════════════════

/**
 * @title AegisDAO
 * @dev Standalone governance and risk-analysis smart contract specified in Section 4.
 *      Combines proposal creation with ECDSA oracle verification, voting,
 *      execution with checks-effects-interactions, and cancellation.
 */
contract AegisDAO is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        uint256 amount;
        address recipient;
        string ipfsHash;
        uint8 safetyScore;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 votingDeadline;
        bool executed;
        bool canceled;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    address public oracleSigner;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public quorumVotes;

    // Bounds for gas safety
    uint256 public constant MAX_TITLE_LENGTH = 120;
    uint256 public constant MAX_IPFS_LENGTH = 100;

    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string title,
        string ipfsHash,
        uint8 safetyScore,
        uint256 votingDeadline
    );
    event Voted(uint256 indexed id, address indexed voter, uint8 support, uint256 weight);
    event ProposalExecuted(uint256 indexed id, address indexed recipient, uint256 amount);
    event ProposalCanceled(uint256 indexed id);
    event OracleSignerUpdated(address indexed oldSigner, address indexed newSigner);

    error InvalidSafetyScore();
    error InvalidOracleSignature();
    error ProposalDoesNotExist();
    error VotingEnded();
    error VotingStillActive();
    error AlreadyVoted();
    error ProposalAlreadyExecuted();
    error ProposalIsCanceled();
    error QuorumNotMet();
    error ProposalDefeated();
    error InsufficientTreasuryBalance();
    error TransferFailed();
    error Unauthorized();
    error StringTooLong();
    error ZeroAddress();

    constructor(address initialOwner, address _oracleSigner, uint256 _quorumVotes) Ownable(initialOwner) {
        if (_oracleSigner == address(0)) revert ZeroAddress();
        oracleSigner = _oracleSigner;
        quorumVotes = _quorumVotes;
    }

    receive() external payable {}

    /**
     * @notice Create a proposal with cryptographically verified AI safety score.
     */
    function createProposal(
        string memory title,
        uint256 amount,
        address recipient,
        string memory ipfsHash,
        uint8 safetyScore,
        bytes memory signature
    ) external returns (uint256) {
        if (bytes(title).length > MAX_TITLE_LENGTH || bytes(ipfsHash).length > MAX_IPFS_LENGTH) {
            revert StringTooLong();
        }
        if (safetyScore > 100) revert InvalidSafetyScore();
        if (recipient == address(0)) revert ZeroAddress();

        // Verify oracle signature over payload
        bytes32 messageHash = keccak256(
            abi.encodePacked(title, amount, recipient, ipfsHash, safetyScore)
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);

        if (recovered != oracleSigner) revert InvalidOracleSignature();

        proposalCount++;
        uint256 proposalId = proposalCount;
        uint256 deadline = block.timestamp + VOTING_PERIOD;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            amount: amount,
            recipient: recipient,
            ipfsHash: ipfsHash,
            safetyScore: safetyScore,
            forVotes: 0,
            againstVotes: 0,
            votingDeadline: deadline,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalId, msg.sender, title, ipfsHash, safetyScore, deadline);
        return proposalId;
    }

    /**
     * @notice Vote on a proposal (1 = For, 0 = Against).
     */
    function vote(uint256 proposalId, uint8 support) external {
        Proposal storage p = proposals[proposalId];
        if (p.id == 0) revert ProposalDoesNotExist();
        if (block.timestamp > p.votingDeadline) revert VotingEnded();
        if (p.executed) revert ProposalAlreadyExecuted();
        if (p.canceled) revert ProposalIsCanceled();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        hasVoted[proposalId][msg.sender] = true;
        uint256 weight = 1;

        if (support == 1) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    /**
     * @notice Execute a succeeded proposal. Follows Checks-Effects-Interactions pattern.
     */
    function execute(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        if (p.id == 0) revert ProposalDoesNotExist();
        if (block.timestamp <= p.votingDeadline) revert VotingStillActive();
        if (p.executed) revert ProposalAlreadyExecuted();
        if (p.canceled) revert ProposalIsCanceled();

        if (p.forVotes + p.againstVotes < quorumVotes) revert QuorumNotMet();
        if (p.forVotes <= p.againstVotes) revert ProposalDefeated();
        if (address(this).balance < p.amount) revert InsufficientTreasuryBalance();

        // Checks-effects-interactions: mutate state before low-level call
        p.executed = true;

        (bool success, ) = payable(p.recipient).call{value: p.amount}("");
        if (!success) revert TransferFailed();

        emit ProposalExecuted(proposalId, p.recipient, p.amount);
    }

    /**
     * @notice Cancel a proposal before execution (proposer or contract owner only).
     */
    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (p.id == 0) revert ProposalDoesNotExist();
        if (msg.sender != p.proposer && msg.sender != owner()) revert Unauthorized();
        if (p.executed) revert ProposalAlreadyExecuted();
        if (p.canceled) revert ProposalIsCanceled();

        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @notice Update trusted oracle signer address.
     */
    function setOracleSigner(address _newOracle) external onlyOwner {
        if (_newOracle == address(0)) revert ZeroAddress();
        address old = oracleSigner;
        oracleSigner = _newOracle;
        emit OracleSignerUpdated(old, _newOracle);
    }

    /**
     * @notice Get proposal details by ID.
     */
    function getProposal(uint256 id) external view returns (Proposal memory) {
        if (proposals[id].id == 0) revert ProposalDoesNotExist();
        return proposals[id];
    }
}

