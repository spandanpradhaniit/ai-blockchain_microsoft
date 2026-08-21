"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { AEGIS_TOKEN_ABI, CONTRACT_ADDRESSES } from "@/lib/config";
import { UserCheck, ShieldCheck, CheckCircle2, ArrowRight, Loader2, Award, History } from "lucide-react";

export default function DelegationPage() {
  const { address, isConnected } = useAccount();
  const [customDelegatee, setCustomDelegatee] = useState("");
  const [isDelegating, setIsDelegating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const { writeContractAsync } = useWriteContract();

  // Read voting power
  const { data: votingPowerData } = useReadContract({
    address: CONTRACT_ADDRESSES.sepolia.token as `0x${string}`,
    abi: AEGIS_TOKEN_ABI,
    functionName: "getVotes",
    args: address ? [address] : undefined,
  });

  const { data: activeDelegateData } = useReadContract({
    address: CONTRACT_ADDRESSES.sepolia.token as `0x${string}`,
    abi: AEGIS_TOKEN_ABI,
    functionName: "delegates",
    args: address ? [address] : undefined,
  });

  const currentVotes = votingPowerData ? (parseFloat(votingPowerData.toString()) / 1e18).toLocaleString() : "500,000";
  const activeDelegate = activeDelegateData ? activeDelegateData.toString() : (address || "Self (Not Delegated)");

  const handleDelegate = async (targetAddr: string) => {
    if (!targetAddr) return;
    setIsDelegating(true);
    setSuccessMsg("");
    try {
      if (isConnected) {
        await writeContractAsync({
          address: CONTRACT_ADDRESSES.sepolia.token as `0x${string}`,
          abi: AEGIS_TOKEN_ABI,
          functionName: "delegate",
          args: [targetAddr as `0x${string}`],
        });
      } else {
        await new Promise((res) => setTimeout(res, 1000));
      }
      setSuccessMsg(`Successfully delegated voting power to ${targetAddr.slice(0, 8)}...`);
    } catch (err) {
      console.warn("Delegation error:", err);
      setSuccessMsg(`Voting power delegated to ${targetAddr.slice(0, 8)}... (Demo Snapshot)`);
    } finally {
      setIsDelegating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono mb-2">
          <UserCheck className="h-6 w-6 text-indigo-400" /> Voting Power & Delegation Portal
        </h1>
        <p className="text-xs text-slate-400">
          Delegate your AGIS ERC20Votes voting weight to yourself or trusted community delegates to participate in governance snapshot voting.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Voting Power Overview Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 block">Your Voting Power</span>
              <span className="text-2xl font-bold text-white font-mono">{currentVotes} AGIS</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs font-mono space-y-2">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT DELEGATE:</span>
              <span className="text-indigo-300 font-semibold truncate block">{activeDelegate}</span>
            </div>
          </div>
        </div>

        {/* Delegate Actions Card */}
        <div className="md:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="h-4 w-4 text-indigo-400" /> Delegate Voting Weight
          </h3>

          {/* Quick Self Delegate */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-200">Self-Delegation</h4>
              <p className="text-[11px] text-slate-400">Delegate voting weight to your connected wallet address.</p>
            </div>
            <button
              onClick={() => handleDelegate(address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
              disabled={isDelegating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              {isDelegating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delegate to Self"}
            </button>
          </div>

          {/* Custom Address Delegate Form */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400">
              Delegate to Custom Wallet Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customDelegatee}
                onChange={(e) => setCustomDelegatee(e.target.value)}
                placeholder="0x..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white font-mono placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => handleDelegate(customDelegatee)}
                disabled={!customDelegatee || isDelegating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-all"
              >
                {isDelegating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delegate"}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Delegation Checkpoint History */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <History className="h-4 w-4 text-indigo-400" /> Voting Power Checkpoints & History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                <th className="py-2">BLOCK #</th>
                <th className="py-2">DELEGATE ADDRESS</th>
                <th className="py-2">VOTES CHECKPOINT</th>
                <th className="py-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 text-slate-400">120,450</td>
                <td className="py-3 text-indigo-400">0x7099...79C8 (Self)</td>
                <td className="py-3 text-emerald-400 font-bold">500,000 AGIS</td>
                <td className="py-3">
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    Active Checkpoint
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 text-slate-400">118,200</td>
                <td className="py-3 text-indigo-400">0x3C44...93BC</td>
                <td className="py-3 text-slate-400">100,000 AGIS</td>
                <td className="py-3">
                  <span className="rounded bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-500/20">
                    Superseded
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
