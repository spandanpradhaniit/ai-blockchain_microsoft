"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProposalCard } from "@/components/ui/ProposalCard";
import { OverviewMetrics } from "@/components/OverviewMetrics";
import { IndexedProposal } from "@/lib/indexer/store";
import {
  ShieldAlert,
  PlusCircle,
  Vote,
  Coins,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function OverviewPage() {
  const [proposals, setProposals] = useState<IndexedProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proposals")
      .then((res) => res.json())
      .then((data) => {
        setProposals(data.proposals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeProposals = proposals.filter((p) => p.state === "Active");
  const queuedProposals = proposals.filter((p) => p.state === "Queued");

  return (
    <div className="space-y-8">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Risk-Gated Protocol Security v1.0</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            AegisDAO Governance & Threat Analysis
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            AI-assisted DAO governance framework combining OpenZeppelin v5 Governor modular smart contracts with real-time payload threat inspection, IPFS proposal pinning, and risk-gated execution timelocks.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/proposals/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all"
            >
              <PlusCircle className="h-4 w-4" /> Create AI-Audited Proposal
            </Link>

            <Link
              href="/proposals"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-5 py-2.5 text-xs font-bold text-slate-200 border border-slate-700/80 hover:bg-slate-800 transition-all"
            >
              <Vote className="h-4 w-4 text-indigo-400" /> Explore Proposals ({proposals.length})
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <OverviewMetrics 
        activeProposalsCount={activeProposals.length} 
        queuedProposalsCount={queuedProposals.length} 
        loading={loading} 
      />

      {/* Active Proposals Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Active & Recent Proposals</h2>
          </div>
          <Link href="/proposals" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1">
            View All ({proposals.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.slice(0, 3).map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </section>

      {/* AI Security Capabilities Feature Showcase */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">AI Threat Detection</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scans raw transaction calldatas, target addresses, and function signatures to identify treasury drain, proxy hijacking, or reentrancy vectors.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">OpenZeppelin v5 Timelock</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Proposals passing quorum are automatically queued in TimelockController enforcing mandatory execution delays for guardian verification.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">IPFS Decentralized Pinning</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Proposal specifications, technical requirements, and audit reports are pinned to IPFS via Pinata SDK with deterministic mock hash fallback.
          </p>
        </div>
      </section>

    </div>
  );
}
