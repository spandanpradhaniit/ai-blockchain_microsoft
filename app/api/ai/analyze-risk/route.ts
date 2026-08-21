import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { createWalletClient, http, keccak256, encodePacked, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { analyzeProposalHeuristics, ProposalRiskAnalysis } from "@/lib/ai";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const AnalyzeRiskRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  targets: z.array(z.string()).default([]),
  values: z.array(z.string()).default([]),
  calldatas: z.array(z.string()).default([]),
  signatures: z.array(z.string()).optional(),
  // Fields required for oracle signing (optional – old callers still work)
  ipfsHash: z.string().optional(),
  amount: z.string().optional(), // wei string
});

const ThreatVectorSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  category: z.string(),
  description: z.string(),
  mitigation: z.string(),
});

const AnalyzeRiskResponseSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  summary: z.string(),
  threatVectors: z.array(ThreatVectorSchema),
  auditChecklist: z.array(z.string()),
  recommendation: z.string(),
  isMockFallback: z.boolean(),
  // Oracle attestation fields — present when ORACLE_PRIVATE_KEY is set
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

// ─── Oracle Signer Helper ────────────────────────────────────────────

/**
 * Signs the risk attestation using the server-side ORACLE_PRIVATE_KEY.
 *
 * messageHash = keccak256(abi.encodePacked(title, amount, ipfsHash, safetyScore))
 *
 * The signature uses EIP-191 "personal_sign" prefix so the contract can
 * recover the signer via ECDSA.recover(toEthSignedMessageHash(hash), sig).
 */
async function signOracleAttestation(params: {
  title: string;
  amount: string;   // wei as decimal string
  ipfsHash: string;
  safetyScore: number; // 0-100 clamped to uint8
}): Promise<{ messageHash: string; signature: string; oracleAddress: string } | null> {
  const oracleKey = process.env.ORACLE_PRIVATE_KEY;
  if (!oracleKey || oracleKey.trim() === "") return null;

  try {
    // Ensure the key has 0x prefix
    const formattedKey = (
      oracleKey.startsWith("0x") ? oracleKey : `0x${oracleKey}`
    ) as `0x${string}`;

    const account = privateKeyToAccount(formattedKey);

    // Replicate Solidity:  keccak256(abi.encodePacked(title, amount, ipfsHash, safetyScore))
    const safetyScoreUint8 = Math.min(Math.max(Math.round(params.safetyScore), 0), 255);
    const amountBigInt = BigInt(params.amount || "0");

    const messageHash = keccak256(
      encodePacked(
        ["string", "uint256", "string", "uint8"],
        [params.title, amountBigInt, params.ipfsHash, safetyScoreUint8]
      )
    );

    // EIP-191 personal_sign: the account.signMessage helper applies the
    // "\x19Ethereum Signed Message:\n32" prefix automatically.
    const signature = await account.signMessage({
      message: { raw: toBytes(messageHash) },
    });

    return {
      messageHash,
      signature,
      oracleAddress: account.address,
    };
  } catch (err) {
    console.error("Oracle signing failed:", err);
    return null;
  }
}

// ─── Route Handler ───────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsedInput = AnalyzeRiskRequestSchema.parse(json);

    // ── 1. Produce risk analysis (AI or heuristic fallback) ──────────
    let riskResult: ProposalRiskAnalysis;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "" || apiKey === "mock_key") {
      riskResult = analyzeProposalHeuristics(parsedInput);
    } else {
      // Call OpenAI API
      const openai = new OpenAI({ apiKey });

      const systemPrompt = `You are AegisDAO AI Risk Auditor. Analyze the provided DAO governance proposal metadata, target contract addresses, ETH values, and encoded calldatas. Output a strictly formatted JSON object with risk assessment.`;

      const userPrompt = `Proposal Title: ${parsedInput.title}
Description: ${parsedInput.description}
Targets: ${JSON.stringify(parsedInput.targets)}
Values (wei): ${JSON.stringify(parsedInput.values)}
Calldatas: ${JSON.stringify(parsedInput.calldatas)}

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

      const aiData = JSON.parse(content);
      aiData.isMockFallback = false;
      riskResult = aiData as ProposalRiskAnalysis;
    }

    // ── 2. Oracle signature (when signing material is supplied) ──────
    let oracleAttestation: {
      messageHash: string;
      signature: string;
      oracleAddress: string;
      title: string;
      amount: string;
      ipfsHash: string;
      safetyScore: number;
    } | undefined;

    const ipfsHash = parsedInput.ipfsHash || "";
    const amount   = parsedInput.amount   || "0";

    if (ipfsHash) {
      const signed = await signOracleAttestation({
        title: parsedInput.title,
        amount,
        ipfsHash,
        safetyScore: riskResult.riskScore,
      });

      if (signed) {
        oracleAttestation = {
          ...signed,
          title: parsedInput.title,
          amount,
          ipfsHash,
          safetyScore: riskResult.riskScore,
        };
      }
    }

    // ── 3. Validate & respond ────────────────────────────────────────
    const response = AnalyzeRiskResponseSchema.parse({
      ...riskResult,
      oracleAttestation,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.warn("AI Risk Analysis API error or fallback triggered:", error);

    try {
      const body = await req.clone().json().catch(() => ({
        title: "Unknown Proposal",
        description: "",
      }));
      const fallbackResult = analyzeProposalHeuristics({
        title: body.title || "Governance Proposal",
        description: body.description || "",
        targets: body.targets || [],
        values: body.values || [],
        calldatas: body.calldatas || [],
      });
      return NextResponse.json(
        AnalyzeRiskResponseSchema.parse({ ...fallbackResult })
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload format" },
        { status: 400 }
      );
    }
  }
}
