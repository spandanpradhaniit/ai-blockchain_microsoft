/**
 * AI Risk Analysis Engine
 *
 * Combines OpenAI structured output with a local heuristic fallback.
 * Uses gpt-4o-mini when OPENAI_API_KEY is available; otherwise falls back
 * to the rule-based threat detection engine.
 */
import { z } from "zod";
import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────

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

export interface AnalyzeRiskInput {
  title: string;
  description: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  signatures?: string[];
}

// ─── Zod Schemas ──────────────────────────────────────────────────────

export const AnalyzeRiskRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  targets: z.array(z.string()).default([]),
  values: z.array(z.string()).default([]),
  calldatas: z.array(z.string()).default([]),
  signatures: z.array(z.string()).optional(),
  ipfsHash: z.string().optional(),
  amount: z.string().optional(),
});

const ThreatVectorSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  category: z.string(),
  description: z.string(),
  mitigation: z.string(),
});

export const AnalyzeRiskResponseSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  summary: z.string(),
  threatVectors: z.array(ThreatVectorSchema),
  auditChecklist: z.array(z.string()),
  recommendation: z.string(),
  isMockFallback: z.boolean(),
  oracleAttestation: z.object({
    messageHash: z.string(),
    signature: z.string(),
    oracleAddress: z.string(),
    title: z.string(),
    amount: z.string(),
    ipfsHash: z.string(),
    safetyScore: z.number(),
  }).optional(),
});

// ─── OpenAI Analysis ──────────────────────────────────────────────────

// Safe default when AI fails
export const SAFE_DEFAULT_RISK_ANALYSIS: ProposalRiskAnalysis = {
  riskScore: 0,
  riskLevel: "CRITICAL",
  summary: "AI analysis failed — manual review required",
  threatVectors: [
    {
      severity: "CRITICAL",
      category: "Analysis Failure",
      description: "Automated AI threat evaluation could not be completed securely.",
      mitigation: "Conduct manual code and payload audit before interacting with proposal.",
    },
  ],
  auditChecklist: [
    "Perform manual audit of payload calldatas",
    "Verify proposer credentials",
  ],
  recommendation: "MANUAL REVIEW REQUIRED — DO NOT PROCEED WITHOUT VERIFICATION",
  isMockFallback: true,
};

export async function analyzeWithOpenAI(input: AnalyzeRiskInput): Promise<ProposalRiskAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "mock_key") {
    return analyzeProposalHeuristics(input);
  }

  const openai = new OpenAI({ apiKey });
  const systemPrompt = `You are AegisDAO AI Risk Auditor. Analyze the provided DAO governance proposal metadata, target contract addresses, ETH values, and encoded calldatas. Output a strictly formatted JSON object with risk assessment.`;
  const userPrompt = `Proposal Title: ${input.title}
Description: ${input.description}
Targets: ${JSON.stringify(input.targets)}
Values (wei): ${JSON.stringify(input.values)}
Calldatas: ${JSON.stringify(input.calldatas)}

Respond ONLY with a JSON object matching this schema:
{
  "riskScore": number (0-100),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "Concise executive summary of risks",
  "threatVectors": [
    {
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "category": "Category name",
      "description": "Explanation of threat",
      "mitigation": "Recommended mitigation strategy"
    }
  ],
  "auditChecklist": ["step 1", "step 2"],
  "recommendation": "Veto, Approve, or Proceed with caution recommendation"
}`;

  // Retry loop: max 2 attempts (initial + 1 retry)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from OpenAI");

      const rawJson = JSON.parse(content);
      const parsed = AnalyzeRiskResponseSchema.partial().safeParse({
        ...rawJson,
        isMockFallback: false,
      });

      if (parsed.success) {
        return {
          riskScore: parsed.data.riskScore ?? 0,
          riskLevel: parsed.data.riskLevel ?? "CRITICAL",
          summary: parsed.data.summary ?? "AI analysis completed",
          threatVectors: parsed.data.threatVectors ?? [],
          auditChecklist: parsed.data.auditChecklist ?? [],
          recommendation: parsed.data.recommendation ?? "Proceed with caution",
          isMockFallback: false,
        };
      } else {
        console.warn(`OpenAI response validation failed (Attempt ${attempt}/2):`, parsed.error);
      }
    } catch (err) {
      console.warn(`OpenAI completion failed (Attempt ${attempt}/2):`, err);
    }
  }

  // If AI attempts fail, fall back to safe default
  console.warn("AI analysis failed after retry — returning safe default response.");
  return SAFE_DEFAULT_RISK_ANALYSIS;
}

// ─── Heuristic Fallback Engine ────────────────────────────────────────

export function analyzeProposalHeuristics(input: AnalyzeRiskInput): ProposalRiskAnalysis {
  let score = 10;
  const threatVectors: ThreatVector[] = [];
  const auditChecklist: string[] = [
    "Verify target contract address on block explorer",
    "Confirm proposer address has required governance threshold",
    "Inspect calldata parameters against governance specifications",
  ];

  const fullText = (input.title + " " + input.description).toLowerCase();

  // 1. Value transfer analysis
  let totalEthValue = 0n;
  for (const valStr of input.values) {
    try { totalEthValue += BigInt(valStr || "0"); } catch { /* ignore */ }
  }

  if (totalEthValue >= 5000000000000000000n) {
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
  for (let i = 0; i < input.calldatas.length; i++) {
    const cd = input.calldatas[i] || "";
    const target = input.targets[i] || "";

    if (cd.startsWith("0xf2fde38b")) {
      score += 75;
      threatVectors.push({
        severity: "CRITICAL",
        category: "Ownership Transfer",
        description: `Target contract ${target} is attempting to transfer ownership.`,
        mitigation: "Verify target owner is intended to be AegisTimelock.",
      });
    }

    if (cd.startsWith("0x36599896") || cd.startsWith("0x845600d3")) {
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

  // 3. Keyword / sentiment risk markers
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
