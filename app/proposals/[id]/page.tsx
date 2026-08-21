"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IndexedProposal } from "@/lib/indexer/store";
import { RiskScoreGauge } from "@/components/ui/RiskScoreGauge";
import { CalldataDecoder } from "@/components/ui/CalldataDecoder";
import { VotingPanel } from "@/components/ui/VotingPanel";
import {
  ShieldAlert,
  Vote,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Play,
  Layers,
  Sparkles,
} from "lucide-react";

export default function ProposalDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [proposal, setProposal] = useState<IndexedProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/proposals?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setProposal(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-900 rounded-lg" />
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-16 glass-card rounded-2xl border border-slate-800 space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Proposal Not Found</h2>
        <p className="text-xs text-slate-400">The requested proposal ID does not exist in the indexer database.</p>
        <Link href="/proposals" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Proposals
        </Link>
      </div>
    );
  }

  const forVotesNum = parseFloat(proposal.forVotes) / 1e18;
  const againstVotesNum = parseFloat(proposal.againstVotes) / 1e18;
  const abstainVotesNum = parseFloat(proposal.abstainVotes) / 1e18;
  const totalVotes = forVotesNum + againstVotesNum + abstainVotesNum;

  const forPercent = totalVotes > 0 ? (forVotesNum / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (againstVotesNum / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (abstainVotesNum / totalVotes) * 100 : 0;

  const handleQueueExecution = (actionType: "queue" | "execute") => {
    setActionSuccess(
      actionType === "queue"
        ? "Proposal successfully queued in AegisTimelock Controller with delay enforced."
        : "Proposal executed successfully via Timelock Controller!"
    );
  };

  return (
    <div className="space-y-8">
      
      {/* Back Link & Header */}
      <div>
        <Link
          href="/proposals"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-indigo-400 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Proposals
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30 font-mono">
                Proposal #{proposal.id.slice(0, 10)}...
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                {proposal.state}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {proposal.title}
            </h1>
          </div>

          {/* IPFS metadata link */}
          <div className="flex items-center gap-3">
            <a
              href={`https://ipfs.io/ipfs/${proposal.ipfsCid}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-mono text-slate-300 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 transition-all"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" /> IPFS: {proposal.ipfsCid.slice(0, 12)}...
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Description, Calldata Payload, & Voting */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Proposal Rationale & Description */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <User className="h-4 w-4 text-indigo-400" /> Proposal Specification & Rationale
            </h3>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed whitespace-pre-line">
              {proposal.description}
            </div>
            <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center gap-2">
              <span>Proposer: {proposal.proposer}</span>
            </div>
          </div>

          {/* Calldata Target Payloads */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Layers className="h-4 w-4 text-indigo-400" /> On-Chain Contract Execution Payloads
            </h3>
            {proposal.targets.map((target, idx) => (
              <CalldataDecoder
                key={idx}
                target={target}
                value={proposal.values[idx] || "0"}
                signature={proposal.signatures[idx]}
                calldata={proposal.calldatas[idx] || "0x"}
              />
            ))}
          </div>

          {/* Voting Panel & Timelock Actions */}
          {proposal.state === "Active" && (
            <VotingPanel proposalId={proposal.id} isVotingActive={true} />
          )}

          {proposal.state === "Succeeded" && (
            <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-amber-500/5 space-y-3">
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Queue Proposal in Timelock
              </h4>
              <p className="text-xs text-slate-300">
                This proposal reached voting quorum and succeeded. Queue it in AegisTimelock Controller to initiate security execution delay.
              </p>
              <button
                onClick={() => handleQueueExecution("queue")}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-amber-500 transition-all"
              >
                <Clock className="h-4 w-4" /> Queue in Timelock
              </button>
            </div>
          )}

          {proposal.state === "Queued" && (
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <Play className="h-4 w-4" /> Execute Timelock Payload
              </h4>
              <p className="text-xs text-slate-300">
                Timelock delay window has elapsed. Anyone can execute this proposal target payload now.
              </p>
              <button
                onClick={() => handleQueueExecution("execute")}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all"
              >
                <Play className="h-4 w-4" /> Execute Proposal
              </button>
            </div>
          )}

        </div>

        {/* Right Column: AI Risk Security Audit & Vote Stats */}
        <div className="space-y-6">
          
          {/* AI Security Risk Inspector Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">AI Security Audit</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-2.5 w-2.5" /> GPT-4o Risk Engine
              </span>
            </div>

            {/* Risk Meter Gauge */}
            <RiskScoreGauge
              score={proposal.riskAnalysis?.riskScore || 0}
              level={proposal.riskAnalysis?.riskLevel || "LOW"}
              size="lg"
            />

            {/* Executive Summary */}
            <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800/80 text-xs text-slate-300">
              <span className="text-[10px] font-mono text-slate-500 block uppercase mb-1">Audit Summary:</span>
              {proposal.riskAnalysis?.summary}
            </div>

            {/* Threat Vectors */}
            {proposal.riskAnalysis?.threatVectors && proposal.riskAnalysis.threatVectors.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 block">Identified Threat Vectors:</span>
                {proposal.riskAnalysis.threatVectors.map((tv, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{tv.category}</span>
                      <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        {tv.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{tv.description}</p>
                    <p className="text-indigo-400 text-[10px] font-mono">Mitigation: {tv.mitigation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Audit Checklist */}
            {proposal.riskAnalysis?.auditChecklist && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-200 block">Voter Verification Checklist:</span>
                <ul className="space-y-1.5">
                  {proposal.riskAnalysis.auditChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Governance Recommendation */}
            <div className="rounded-xl bg-indigo-950/40 p-3 border border-indigo-500/30 text-xs text-indigo-200 font-mono">
              <span className="text-[10px] text-indigo-400 uppercase block mb-0.5 font-bold">Recommendation:</span>
              {proposal.riskAnalysis?.recommendation}
            </div>

          </div>

          {/* Voting Results & Participation Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Vote className="h-4 w-4 text-indigo-400" /> Voting Participation
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="text-emerald-400 font-semibold">FOR</span>
                  <span>{forVotesNum.toLocaleString()} AGIS ({forPercent.toFixed(1)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${forPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="text-rose-400 font-semibold">AGAINST</span>
                  <span>{againstVotesNum.toLocaleString()} AGIS ({againstPercent.toFixed(1)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${againstPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span className="text-slate-400 font-semibold">ABSTAIN</span>
                  <span>{abstainVotesNum.toLocaleString()} AGIS ({abstainPercent.toFixed(1)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500" style={{ width: `${abstainPercent}%` }} />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
