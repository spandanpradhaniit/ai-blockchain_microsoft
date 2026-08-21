export interface ThreatVector {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  description: string;
  mitigation: string;
}

export interface ProposalRiskAnalysis {
  riskScore: number; // 0 to 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  threatVectors: ThreatVector[];
  auditChecklist: string[];
  recommendation: string;
  isMockFallback: boolean;
  oracleAttestation?: {
    messageHash: string;
    signature: string;
    oracleAddress: string;
    title: string;
    amount: string;
    ipfsHash: string;
    safetyScore: number;
  };
}

/**
 * Heuristic Risk Rule Engine for Smart Contract Call Data and Proposal Metadata.
 * Used when OPENAI_API_KEY is not present or API call is unavailable.
 */
export function analyzeProposalHeuristics(input: {
  title: string;
  description: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  signatures?: string[];
}): ProposalRiskAnalysis {
  let score = 10; // baseline low risk score
  const threatVectors: ThreatVector[] = [];
  const auditChecklist: string[] = [
    "Verify target contract address on block explorer",
    "Confirm proposer address has required governance threshold",
    "Inspect calldata parameters against governance specifications",
  ];

  const fullText = (input.title + " " + input.description).toLowerCase();
  const targets = input.targets;
  const values = input.values;
  const calldatas = input.calldatas;

  // 1. Value transfer analysis
  let totalEthValue = 0n;
  for (const valStr of values) {
    try {
      const val = BigInt(valStr || "0");
      totalEthValue += val;
    } catch {
      // ignore parse error
    }
  }

  // ETH threshold checks (1 ETH = 1e18 wei)
  if (totalEthValue >= 5000000000000000000n) {
    // >= 5 ETH
    score += 55;
    threatVectors.push({
      severity: "HIGH",
      category: "Treasury Drain Risk",
      description: "Proposal requests a massive treasury balance transfer (>= 5 ETH).",
      mitigation: "Require multi-sig signoff or milestone-based vesting schedule.",
    });
    auditChecklist.push("Confirm recipient wallet address is a verified community multi-sig or timelock vault");
  } else if (totalEthValue > 0n) {
    score += 10;
    threatVectors.push({
      severity: "MEDIUM",
      category: "Treasury Expenditure",
      description: "Proposal involves native token/ETH transfer from DAO treasury.",
      mitigation: "Ensure grant deliverables are recorded in IPFS proposal payload.",
    });
  }

  // 2. High-risk function signature checks
  for (let i = 0; i < calldatas.length; i++) {
    const cd = calldatas[i] || "";
    const target = targets[i] || "";

    if (cd.startsWith("0xf2fde38b")) {
      // transferOwnership(address)
      score += 75;
      threatVectors.push({
        severity: "CRITICAL",
        category: "Ownership Transfer",
        description: `Target contract ${target} is attempting to transfer ownership.`,
        mitigation: "Verify target owner is intended to be AegisTimelock.",
      });
    }

    if (cd.startsWith("0x36599896") || cd.startsWith("0x845600d3")) {
      // setEmergencyPause / pause
      score += 30;
      threatVectors.push({
        severity: "HIGH",
        category: "State Pause Operation",
        description: "Proposal contains emergency pause or unpause execution.",
        mitigation: "Verify emergency response justification and emergency protocol guidelines.",
      });
    }

    if (cd.startsWith("0x36599896")) {
      auditChecklist.push("Ensure Guardian role or Timelock emergency delay has been evaluated");
    }
  }

  // 3. Keyword / sentiment risk markers in text
  if (fullText.includes("emergency") || fullText.includes("critical") || fullText.includes("fix")) {
    score += 10;
  }
  if (fullText.includes("upgrade") || fullText.includes("proxy") || fullText.includes("implementation")) {
    score += 25;
    threatVectors.push({
      severity: "HIGH",
      category: "Smart Contract Upgrade",
      description: "Proposal mentions upgrading smart contract logic or proxy implementation.",
      mitigation: "Audit new implementation bytecode diff before casting affirmative vote.",
    });
    auditChecklist.push("Verify bytecode diff of implementation contract against audited repository");
  }

  // Cap score between 0 and 100
  score = Math.min(Math.max(score, 5), 98);

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (score >= 80) riskLevel = "CRITICAL";
  else if (score >= 50) riskLevel = "HIGH";
  else if (score >= 30) riskLevel = "MEDIUM";

  const recommendation =
    riskLevel === "CRITICAL"
      ? "RECOMMEND VETO OR TIMELOCK EXTENSION: High-severity security threat detected."
      : riskLevel === "HIGH"
      ? "PROCEED WITH CAUTION: Detailed audit of target payload recommended before voting FOR."
      : riskLevel === "MEDIUM"
      ? "STANDARD REVIEW: Proposal exhibits moderate treasury/parameter impact."
      : "LOW RISK: Proposal passes heuristic security baseline check.";

  return {
    riskScore: score,
    riskLevel,
    summary: `Heuristic rule engine completed security audit. Identified ${threatVectors.length} threat vector(s) with an overall risk score of ${score}/100 (${riskLevel}).`,
    threatVectors,
    auditChecklist,
    recommendation,
    isMockFallback: true,
  };
}
