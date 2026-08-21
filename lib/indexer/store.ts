import { ProposalRiskAnalysis } from "../ai/risk-rules";

export interface IndexedProposal {
  id: string; // Proposal ID (uint256 string or hex)
  proposer: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  title: string;
  description: string;
  ipfsCid: string;
  startBlock: number;
  endBlock: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  state: "Pending" | "Active" | "Canceled" | "Defeated" | "Succeeded" | "Queued" | "Expired" | "Executed";
  eta: number; // Timelock ETA timestamp
  riskAnalysis: ProposalRiskAnalysis;
  createdAt: number;
}

// In-memory indexed seed proposals
const INITIAL_PROPOSALS: IndexedProposal[] = [
  {
    id: "78291048201948201928401928401928401",
    proposer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    targets: ["0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"],
    values: ["1500000000000000000"], // 1.5 ETH
    signatures: ["releaseGrant(address,uint256,string)"],
    calldatas: ["0x9b3293ca00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000014d1120d7b160000"],
    title: "AIP-1: Aegis Security Research & Verification Grant",
    description: "Proposal to fund community security audits and automated threat detection rulesets for AegisDAO smart contracts. The grant will be paid out to the verified security workgroup multisig upon milestone completion.",
    ipfsCid: "QmAEGIS782910482019482",
    startBlock: 120500,
    endBlock: 125500,
    forVotes: "450000000000000000000000", // 450,000 AGIS
    againstVotes: "12000000000000000000000", // 12,000 AGIS
    abstainVotes: "5000000000000000000000",
    state: "Active",
    eta: 0,
    riskAnalysis: {
      riskScore: 18,
      riskLevel: "LOW",
      summary: "Low risk standard grant release payload (1.5 ETH) to verified team recipient address.",
      threatVectors: [
        {
          severity: "LOW",
          category: "Treasury Distribution",
          description: "1.5 ETH release from Treasury Vault.",
          mitigation: "Milestone status logged to IPFS prior to voting phase.",
        },
      ],
      auditChecklist: [
        "Verified recipient address matches workgroup multisig",
        "Checked current treasury balance exceeds 1.5 ETH",
      ],
      recommendation: "APPROVE: Proposal passes security and governance baseline check.",
      isMockFallback: true,
    },
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "39019284019284019284019284019284012",
    proposer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    targets: ["0x90F79bf6EB2c4f8080653215163f680172571500"],
    values: ["0"],
    signatures: ["updateParameter(bytes32,uint256)"],
    calldatas: ["0x36599896"],
    title: "AIP-2: Emergency Risk Delay Parameter Increase",
    description: "Adjust governance timelock minDelay parameter from 60 seconds to 24 hours (86400 seconds) to ensure adequate AI security audit review window for all high-value proposals.",
    ipfsCid: "QmAEGIS390192840192840",
    startBlock: 118000,
    endBlock: 120000,
    forVotes: "820000000000000000000000",
    againstVotes: "5000000000000000000000",
    abstainVotes: "0",
    state: "Queued",
    eta: Math.floor(Date.now() / 1000) + 3600,
    riskAnalysis: {
      riskScore: 35,
      riskLevel: "MEDIUM",
      summary: "Parameter change affecting timelock execution window.",
      threatVectors: [
        {
          severity: "MEDIUM",
          category: "Governance Parameter Shift",
          description: "Increases execution delay window.",
          mitigation: "Enhances security window for AI risk analysis.",
        },
      ],
      auditChecklist: ["Verified new minDelay value matches 86400 seconds"],
      recommendation: "APPROVE: Enhances protocol defense posture.",
      isMockFallback: true,
    },
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "91028301928301928301928301928301923",
    proposer: "0x90F79bf6EB2c4f8080653215163f680172571500",
    targets: ["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"],
    values: ["8000000000000000000"], // 8 ETH
    signatures: ["releaseGrant(address,uint256,string)"],
    calldatas: ["0x9b3293ca"],
    title: "AIP-3: Liquidity Provision & Cross-chain Bridge Grant",
    description: "Requesting 8 ETH from treasury to fund automated market maker liquidity pool on Polygon Amoy testnet.",
    ipfsCid: "QmAEGIS910283019283019",
    startBlock: 110000,
    endBlock: 115000,
    forVotes: "950000000000000000000000",
    againstVotes: "30000000000000000000000",
    abstainVotes: "1000000000000000000000",
    state: "Executed",
    eta: Math.floor(Date.now() / 1000) - 86400,
    riskAnalysis: {
      riskScore: 72,
      riskLevel: "HIGH",
      summary: "High ETH value transfer proposal (8 ETH).",
      threatVectors: [
        {
          severity: "HIGH",
          category: "Treasury Drain",
          description: "8 ETH transfer exceeds 5 ETH threshold.",
          mitigation: "Multi-sig escrow verification completed.",
        },
      ],
      auditChecklist: ["Verified multi-sig ownership"],
      recommendation: "EXECUTED: Proposal satisfied timelock requirements.",
      isMockFallback: true,
    },
    createdAt: Date.now() - 86400000 * 10,
  },
];

let globalProposalsStore: IndexedProposal[] = [...INITIAL_PROPOSALS];

export function getIndexedProposals(filterState?: string, search?: string): IndexedProposal[] {
  let list = [...globalProposalsStore];

  if (filterState && filterState !== "All") {
    list = list.filter((p) => p.state.toLowerCase() === filterState.toLowerCase());
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.proposer.toLowerCase().includes(q) ||
        p.id.includes(q)
    );
  }

  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export function getIndexedProposalById(id: string): IndexedProposal | undefined {
  return globalProposalsStore.find((p) => p.id === id);
}

export function saveIndexedProposal(proposal: IndexedProposal): void {
  const existingIdx = globalProposalsStore.findIndex((p) => p.id === proposal.id);
  if (existingIdx >= 0) {
    globalProposalsStore[existingIdx] = proposal;
  } else {
    globalProposalsStore.unshift(proposal);
  }
}
