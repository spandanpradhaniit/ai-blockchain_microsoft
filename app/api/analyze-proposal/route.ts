import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzeWithOpenAI, ProposalRiskAnalysis } from "@/lib/ai";
import { pinToIPFS } from "@/lib/ipfs";
import { signOracleAttestation } from "@/lib/oracle";

// ─── Zod Schema for Request Validation ───────────────────────────────

const AnalyzeProposalRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title cannot exceed 120 characters"),
  amount: z.string().default("0"),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid 20-byte Ethereum address"),
  text: z.string().max(8000, "Proposal text cannot exceed 8000 characters").default(""),
});

/**
 * POST /api/analyze-proposal
 *
 * Pipeline:
 *  1. Rate Limit per IP/wallet (10 req/min)
 *  2. Validate input schema with Zod (max text 8000 chars)
 *  3. Call OpenAI Web3 auditor with structured outputs & 1 retry (safe fallback on failure)
 *  4. Upload evaluation to IPFS via Pinata (fallback to mock CID)
 *  5. Sign payload (title, amount, recipient, ipfsHash, safetyScore) with ORACLE_PRIVATE_KEY
 *  6. Return { evaluation, ipfsCid, signature, oracleAddress }
 */
export async function POST(req: Request) {
  // ── 1. Rate Limiting ──────────────────────────────────────────────
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = checkRateLimit(clientIp, 10, 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 10 requests per minute allowed." },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.resetMs / 1000).toString() } }
    );
  }

  // ── 2. Validate Input ─────────────────────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const validation = AnalyzeProposalRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { title, amount, recipient, text } = validation.data;

  // ── 3. Call OpenAI Structured Risk Auditor ────────────────────────
  let evaluation: ProposalRiskAnalysis;
  try {
    evaluation = await analyzeWithOpenAI({
      title,
      description: text,
      targets: [recipient],
      values: [amount],
      calldatas: [],
    });
  } catch (aiErr) {
    console.error("Unrecoverable AI Provider Error:", aiErr);
    return NextResponse.json(
      { error: "AI Security Audit Provider Error", message: String(aiErr) },
      { status: 502 }
    );
  }

  // ── 4. Upload Evaluation JSON to IPFS ─────────────────────────────
  let ipfsCid = "";
  try {
    const pinResult = await pinToIPFS({
      title,
      amount,
      recipient,
      text,
      evaluation,
      createdAt: Date.now(),
    });
    ipfsCid = pinResult.cid;
  } catch (ipfsErr) {
    console.warn("IPFS upload failed, using fallback mock CID:", ipfsErr);
    ipfsCid = `QmAEGIS${Math.abs(title.length).toString(16)}${Date.now().toString(36)}`;
  }

  // ── 5. Sign Attestation with Oracle Key ───────────────────────────
  const signed = await signOracleAttestation({
    title,
    amount,
    recipient,
    ipfsHash: ipfsCid,
    safetyScore: evaluation.riskScore,
  });

  // ── 6. Return Payload ─────────────────────────────────────────────
  return NextResponse.json({
    evaluation,
    ipfsCid,
    signature: signed?.signature || null,
    oracleAddress: signed?.oracleAddress || null,
  });
}
