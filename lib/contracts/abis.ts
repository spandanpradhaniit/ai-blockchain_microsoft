export const CONTRACT_ADDRESSES = {
  sepolia: {
    token: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    governor: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    timelock: "0x90F79bf6EB2c4f8080653215163f680172571500",
    treasury: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  },
  amoy: {
    token: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    governor: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    timelock: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    treasury: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
  },
};

export const AEGIS_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function getVotes(address account) view returns (uint256)",
  "function delegates(address account) view returns (address)",
  "function delegate(address delegatee)",
  "function transfer(address to, uint256 amount) returns (bool)",
] as const;

export const AEGIS_GOVERNOR_ABI = [
  "function name() view returns (string)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function proposeWithAttestation(address[] targets, uint256[] values, bytes[] calldatas, string description, string title, uint256 amount, string ipfsHash, uint8 safetyScore, bytes oracleSignature) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) view returns (uint256)",
  "function riskOracle() view returns (address)",
  "function setRiskOracle(address newOracle)",
  "event ProposalAttested(uint256 indexed proposalId, string title, uint256 amount, string ipfsHash, uint8 safetyScore, address oracleSigner)",
  "event RiskOracleUpdated(address indexed oldOracle, address indexed newOracle)",
] as const;

export const AEGIS_TREASURY_ABI = [
  "function releaseGrant(address recipient, uint256 amount, string reason)",
  "function updateParameter(bytes32 key, uint256 value)",
  "function isPaused() view returns (bool)",
  "function setEmergencyPause(bool paused)",
] as const;
