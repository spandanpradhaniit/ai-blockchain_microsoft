import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

const DraftProposalRequestSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters"),
  category: z.enum(["grant", "parameter_change", "emergency_pause", "general"]).default("general"),
});

const ActionPayloadSchema = z.object({
  target: z.string(),
  valueEth: z.string(),
  functionSignature: z.string(),
  calldataHex: z.string(),
  description: z.string(),
});

const DraftProposalResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  rationale: z.string(),
  specification: z.string(),
  suggestedActions: z.array(ActionPayloadSchema),
  isMockFallback: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = DraftProposalRequestSchema.parse(json);

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "" || apiKey === "mock_key") {
      // Mock Draft Generator
      const mockDraft = generateMockDraft(parsed.prompt, parsed.category);
      return NextResponse.json(DraftProposalResponseSchema.parse(mockDraft));
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are AegisDAO AI Governance Assistant. Generate structured, well-formatted DAO governance proposals with precise title, summary, rationale, technical specification, and target smart contract call payloads.",
        },
        {
          role: "user",
          content: `User Goal: ${parsed.prompt}\nCategory: ${parsed.category}\n\nRespond ONLY with a JSON object:\n{
  "title": "Clear, concise title",
  "summary": "2-3 sentence overview",
  "rationale": "Why this proposal is beneficial for AegisDAO",
  "specification": "Technical specification details in markdown",
  "suggestedActions": [
    {
      "target": "0x...",
      "valueEth": "0.0",
      "functionSignature": "releaseGrant(address,uint256,string)",
      "calldataHex": "0x...",
      "description": "Call description"
    }
  ]
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");

    const data = JSON.parse(content);
    data.isMockFallback = false;

    return NextResponse.json(DraftProposalResponseSchema.parse(data));
  } catch (error) {
    console.warn("AI Proposal Drafting error or fallback:", error);
    const body = await req.clone().json().catch(() => ({ prompt: "Community Initiative", category: "general" }));
    const mockDraft = generateMockDraft(body.prompt || "Grant Proposal", body.category || "grant");
    return NextResponse.json(DraftProposalResponseSchema.parse(mockDraft));
  }
}

function generateMockDraft(userPrompt: string, category: string) {
  const isGrant = category === "grant" || userPrompt.toLowerCase().includes("grant") || userPrompt.toLowerCase().includes("fund");

  return {
    title: isGrant
      ? `AegisDAO Ecosystem Grant: ${userPrompt.slice(0, 45)}`
      : `Governance Parameter Optimization: ${userPrompt.slice(0, 45)}`,
    summary: `This proposal outlines a structured governance action to ${userPrompt}. It aims to enhance AegisDAO treasury deployment and protocol security.`,
    rationale: `Strategic allocation of resources alignment with community growth goals. Implementing this initiative directly addresses key DAO priorities described in user request: "${userPrompt}".`,
    specification: `### Technical Specification\n1. Target Contract: AegisTreasury Vault\n2. Execution Scope: Authorization of payload with timelock verification.\n3. Deliverables & Milestones: Quarterly progress report submitted to IPFS.`,
    suggestedActions: [
      {
        target: "0x0000000000000000000000000000000000000000",
        valueEth: isGrant ? "1.5" : "0.0",
        functionSignature: isGrant
          ? "releaseGrant(address recipient, uint256 amount, string reason)"
          : "updateParameter(bytes32 key, uint256 value)",
        calldataHex: "0x",
        description: isGrant ? "Transfer 1.5 ETH from Treasury Vault to Grantee" : "Update System Risk Parameter",
      },
    ],
    isMockFallback: true,
  };
}
