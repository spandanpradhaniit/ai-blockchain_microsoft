"use client";

import React from "react";
import Link from "next/link";
import { IndexedProposal } from "@/lib/indexer/store";
import { RiskScoreGauge } from "./RiskScoreGauge";
import { Vote, Clock, ArrowRight, ShieldCheck, User } from "lucide-react";

export function ProposalCard({ proposal }: { proposal: IndexedProposal }) {
  // Format voting totals (assuming 18 decimals AGIS token)
  const forVotesNum = parseFloat(proposal.forVotes) / 1e18;
  const againstVotesNum = parseFloat(proposal.againstVotes) / 1e18;
  const abstainVotesNum = parseFloat(proposal.abstainVotes) / 1e18;
  const totalVotes = forVotesNum + againstVotesNum + abstainVotesNum;

  const forPercent = totalVotes > 0 ? (forVotesNum / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (againstVotesNum / totalVotes) * 100 : 0;

  const getStatusBadge = (state: string) => {
    switch (state) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse";
      case "Queued":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Executed":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "Defeated":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="glass-card glass-card-hover flex flex-col justify-between rounded-2xl p-6 relative overflow-hidden group">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-indigo-600/10 blur-2xl pointer-events-none group-hover:bg-indigo-600/20 transition-all" />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusBadge(proposal.state)}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {proposal.state}
            </span>
            <span className="text-xs font-mono text-slate-400">
              #{proposal.id.slice(0, 8)}
            </span>
          </div>

          <RiskScoreGauge
            score={proposal.riskAnalysis?.riskScore || 0}
            level={proposal.riskAnalysis?.riskLevel || "LOW"}
            size="sm"
            showDetails={false}
          />
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-300 transition-colors">
          {proposal.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-6 leading-relaxed">
          {proposal.description}
        </p>
      </div>

      {/* Footer Metrics & Actions */}
      <div>
        {/* Voting Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span className="text-emerald-400 font-semibold">For: {forVotesNum.toLocaleString()}</span>
            <span className="text-rose-400 font-semibold">Against: {againstVotesNum.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            <div
              className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
              style={{ width: `${forPercent}%` }}
            />
            <div
              className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
              style={{ width: `${againstPercent}%` }}
            />
          </div>
        </div>

        {/* Proposer Info & Link */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span>{proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
          </div>

          <Link
            href={`/proposals/${proposal.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors group/btn"
          >
            <span>View Security Audit</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
