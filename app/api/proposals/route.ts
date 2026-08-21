import { NextResponse } from "next/server";
import { getIndexedProposals, saveIndexedProposal, IndexedProposal } from "@/lib/indexer/store";
import { z } from "zod";

const CreateProposalSchema = z.object({
  id: z.string(),
  proposer: z.string(),
  targets: z.array(z.string()),
  values: z.array(z.string()),
  signatures: z.array(z.string()).default([]),
  calldatas: z.array(z.string()),
  title: z.string(),
  description: z.string(),
  ipfsCid: z.string(),
  riskAnalysis: z.any(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") || undefined;
  const search = searchParams.get("search") || undefined;
  const id = searchParams.get("id");

  if (id) {
    const proposal = getIndexedProposals().find((p) => p.id === id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    return NextResponse.json(proposal);
  }

  const proposals = getIndexedProposals(state, search);
  return NextResponse.json({
    proposals,
    total: proposals.length,
  });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = CreateProposalSchema.parse(json);

    const newProposal: IndexedProposal = {
      id: parsed.id,
      proposer: parsed.proposer,
      targets: parsed.targets,
      values: parsed.values,
      signatures: parsed.signatures,
      calldatas: parsed.calldatas,
      title: parsed.title,
      description: parsed.description,
      ipfsCid: parsed.ipfsCid,
      startBlock: 121000,
      endBlock: 126000,
      forVotes: "0",
      againstVotes: "0",
      abstainVotes: "0",
      state: "Active",
      eta: 0,
      riskAnalysis: parsed.riskAnalysis,
      createdAt: Date.now(),
    };

    saveIndexedProposal(newProposal);
    return NextResponse.json({ success: true, proposal: newProposal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid proposal format" }, { status: 400 });
  }
}
