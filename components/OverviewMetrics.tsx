import React from "react";
import { Coins, Activity, Users, ShieldCheck } from "lucide-react";

interface OverviewMetricsProps {
  activeProposalsCount: number;
  queuedProposalsCount: number;
  loading?: boolean;
}

export function OverviewMetrics({ activeProposalsCount, queuedProposalsCount, loading = false }: OverviewMetricsProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4 animate-pulse">
             <div className="h-12 w-12 rounded-xl bg-slate-800/50" />
             <div className="space-y-2">
               <div className="h-3 w-20 bg-slate-800/50 rounded" />
               <div className="h-6 w-12 bg-slate-700/50 rounded" />
             </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Coins className="h-6 w-6" />
        </div>
        <div>
          <span className="text-slate-400 text-xs font-mono block">Treasury Balance</span>
          <span className="text-xl font-bold text-white font-mono">10.0 ETH</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <span className="text-slate-400 text-xs font-mono block">Active Proposals</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{activeProposalsCount}</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <span className="text-slate-400 text-xs font-mono block">AGIS Total Supply</span>
          <span className="text-xl font-bold text-white font-mono">10.0M</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <span className="text-slate-400 text-xs font-mono block">Queued Timelock</span>
          <span className="text-xl font-bold text-amber-300 font-mono">{queuedProposalsCount}</span>
        </div>
      </div>
    </section>
  );
}
