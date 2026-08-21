"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, ShieldCheck, Zap, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { ProposalRiskAnalysis } from "@/lib/ai";

interface AIRiskReportCardProps {
  analysis: ProposalRiskAnalysis | null;
  ipfsCid: string;
  signature?: string | null;
  loading?: boolean;
}

export function AIRiskReportCard({ analysis, ipfsCid, signature, loading = false }: AIRiskReportCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (ipfsCid) {
      navigator.clipboard.writeText(ipfsCid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 animate-pulse">
        <div className="flex flex-col items-center justify-center gap-4 min-w-[160px]">
          <div className="h-32 w-32 rounded-full bg-slate-800/60 flex items-center justify-center font-mono text-xs text-slate-500">
            Analyzing...
          </div>
          <div className="h-6 w-24 rounded-full bg-slate-800/80" />
        </div>
        <div className="flex-1 space-y-4 w-full">
          <div className="h-4 w-40 bg-slate-800/80 rounded" />
          <div className="h-12 w-full bg-slate-800/50 rounded-xl" />
          <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const normalizedScore = Math.min(Math.max(analysis.riskScore, 0), 100);

  const getColorTheme = () => {
    switch (analysis.riskLevel) {
      case "CRITICAL":
        return {
          stroke: "#ef4444",
          text: "text-red-400",
          bg: "bg-red-500/10 border-red-500/30",
          badge: "bg-red-500/20 text-red-300 border-red-500/40",
          Icon: ShieldAlert,
        };
      case "HIGH":
        return {
          stroke: "#f97316",
          text: "text-orange-400",
          bg: "bg-orange-500/10 border-orange-500/30",
          badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          Icon: AlertTriangle,
        };
      case "MEDIUM":
        return {
          stroke: "#eab308",
          text: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/30",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          Icon: Zap,
        };
      case "LOW":
      default:
        return {
          stroke: "#10b981",
          text: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/30",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          Icon: ShieldCheck,
        };
    }
  };

  const theme = getColorTheme();
  const Icon = theme.Icon;
  const dimensions = { box: 140, radius: 52, stroke: 8, font: "text-2xl" };

  const hasSignature = Boolean(signature || analysis.oracleAttestation?.signature);

  return (
    <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
      
      {/* Animated Gauge */}
      <div 
        className="flex flex-col items-center justify-center gap-4 min-w-[160px]"
        role="progressbar"
        aria-valuenow={normalizedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Security Risk Score: ${normalizedScore} out of 100 (${analysis.riskLevel} risk)`}
      >
        <div className="relative flex items-center justify-center">
          <svg width={dimensions.box} height={dimensions.box} viewBox="0 0 100 100" className="transform -rotate-90 drop-shadow-md">
            <circle cx="50" cy="50" r="42" stroke="rgba(30, 41, 59, 0.8)" strokeWidth={dimensions.stroke} fill="none" />
            <motion.circle
              cx="50" cy="50" r="42" stroke={theme.stroke} strokeWidth={dimensions.stroke}
              strokeDasharray={264} initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (264 * normalizedScore) / 100 }}
              transition={{ duration: 1.2, ease: "easeOut" }} strokeLinecap="round" fill="none"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className={`font-bold ${dimensions.font} ${theme.text}`}>{normalizedScore}</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">/ 100</span>
          </div>
        </div>

        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${theme.badge}`}>
          <Icon className="h-4 w-4" />
          <span>{analysis.riskLevel} RISK</span>
        </div>
      </div>

      {/* Analysis Details & IPFS */}
      <div className="flex-1 flex flex-col space-y-4 text-xs justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
             <h4 className="font-bold text-slate-200 text-sm">Security Audit Result</h4>
             {hasSignature ? (
               <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Signature Verified ✓
               </div>
             ) : (
               <div className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                 Unsigned Assessment
               </div>
             )}
          </div>
          <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
          <div className="rounded-lg bg-indigo-950/60 p-3 border border-indigo-500/30 font-mono text-indigo-300">
            {analysis.recommendation}
          </div>
        </div>

        {/* IPFS CID with Copy & Gateway Link */}
        <div className="flex items-center justify-between bg-slate-950 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">IPFS CID:</span>
            <span className="text-slate-300 font-mono truncate">{ipfsCid || "Pending upload..."}</span>
          </div>
          {ipfsCid && (
            <div className="flex items-center gap-2 pl-2">
              <button onClick={handleCopy} className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="Copy CID">
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <a 
                href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 transition-colors"
                title="View on IPFS Gateway"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
