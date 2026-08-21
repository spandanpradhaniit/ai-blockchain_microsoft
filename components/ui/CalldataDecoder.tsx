"use client";

import React from "react";
import { Code2, ArrowUpRight, Shield, Coins, Settings } from "lucide-react";

interface CalldataDecoderProps {
  target: string;
  value: string;
  signature?: string;
  calldata: string;
}

export function CalldataDecoder({ target, value, signature, calldata }: CalldataDecoderProps) {
  // Format ETH value if present
  const valueEth = (parseFloat(value || "0") / 1e18).toFixed(4);
  const isEthTransfer = parseFloat(value || "0") > 0;

  // Simple heuristic signature decoder for Aegis contracts
  let decodedMethod = signature || "Unknown Transaction";
  if (calldata.startsWith("0x9b3293ca")) {
    decodedMethod = "releaseGrant(address recipient, uint256 amount, string reason)";
  } else if (calldata.startsWith("0x36599896")) {
    decodedMethod = "updateParameter(bytes32 key, uint256 value)";
  } else if (calldata.startsWith("0xf2fde38b")) {
    decodedMethod = "transferOwnership(address newOwner)";
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs text-slate-300">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Execution Target Payload</span>
        </div>
        {isEthTransfer ? (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
            <Coins className="h-3 w-3" /> {valueEth} ETH
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
            <Settings className="h-3 w-3" /> Contract Call
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Target Contract:</span>
          <a
            href={`https://sepolia.etherscan.io/address/${target}`}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            {target} <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Decoded Method:</span>
          <span className="text-emerald-400 font-bold">{decodedMethod}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Raw Calldata Hex:</span>
          <div className="bg-slate-950 p-2 rounded border border-slate-800/80 text-[11px] text-slate-400 break-all select-all">
            {calldata}
          </div>
        </div>
      </div>
    </div>
  );
}
