"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IndexedProposal } from "@/lib/indexer/store";
import { FileText, ExternalLink, ArrowUpDown, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useWaitForTransactionReceipt, useAccount } from "wagmi";

interface ProposalsTableProps {
  proposals: IndexedProposal[];
  loading?: boolean;
}

export function ProposalsTable({ proposals, loading = false }: ProposalsTableProps) {
  const [sortField, setSortField] = useState<keyof IndexedProposal>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: keyof IndexedProposal) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedProposals = [...proposals].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProposals.length / itemsPerPage) || 1;
  const paginatedProposals = sortedProposals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl border border-slate-800 p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-mono text-slate-400">
              <th
                tabIndex={0}
                role="button"
                aria-label="Sort by Proposal ID"
                className="p-4 font-medium cursor-pointer hover:text-slate-200 focus:outline-none focus:text-indigo-400"
                onClick={() => handleSort("id")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("id"); }}
              >
                <div className="flex items-center gap-1">ID <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th
                tabIndex={0}
                role="button"
                aria-label="Sort by Title"
                className="p-4 font-medium cursor-pointer hover:text-slate-200 focus:outline-none focus:text-indigo-400"
                onClick={() => handleSort("title")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("title"); }}
              >
                <div className="flex items-center gap-1">Title <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th
                tabIndex={0}
                role="button"
                aria-label="Sort by Status"
                className="p-4 font-medium cursor-pointer hover:text-slate-200 focus:outline-none focus:text-indigo-400"
                onClick={() => handleSort("state")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("state"); }}
              >
                <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th
                tabIndex={0}
                role="button"
                aria-label="Sort by Creation Date"
                className="p-4 font-medium cursor-pointer hover:text-slate-200 focus:outline-none focus:text-indigo-400"
                onClick={() => handleSort("createdAt")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSort("createdAt"); }}
              >
                <div className="flex items-center gap-1">Created <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="p-4 font-medium">Tx Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {paginatedProposals.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No proposals found</td>
              </tr>
            ) : (
              paginatedProposals.map((p) => (
                <ProposalTableRow key={p.id} proposal={p} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-slate-900/40 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedProposals.length)} of {sortedProposals.length} entries
        </div>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            Prev
          </button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalTableRow({ proposal }: { proposal: IndexedProposal }) {
  const { chain } = useAccount();
  const explorerBaseUrl = chain?.blockExplorers?.default?.url || "https://sepolia.etherscan.io";

  // Use txHash from proposal if present
  const txHash = (proposal as any).txHash || "0x0"; 
  
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    query: {
      enabled: txHash !== "0x0"
    }
  });

  const getStatusColor = (state: string) => {
    switch(state) {
      case "Active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Queued": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Executed": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Defeated": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <tr className="hover:bg-slate-800/30 transition-colors group">
      <td className="p-4 font-mono text-xs text-slate-300">
        <Link href={`/proposals/${proposal.id}`} className="hover:text-indigo-400 transition-colors">
          #{proposal.id.slice(0, 8)}...
        </Link>
      </td>
      <td className="p-4">
        <Link href={`/proposals/${proposal.id}`} className="flex items-center gap-2 font-medium text-slate-200 hover:text-indigo-400 transition-colors">
          <FileText className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          {proposal.title}
        </Link>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusColor(proposal.state)}`}>
          {proposal.state}
        </span>
      </td>
      <td className="p-4 text-xs text-slate-400 font-mono">
        {new Date(proposal.createdAt).toLocaleDateString()}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {txHash !== "0x0" ? (
             <div className="flex items-center gap-2 text-xs">
                {isLoading ? (
                  <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Loader2 className="h-3 w-3 animate-spin" /> Pending
                  </span>
                ) : receipt?.status === "success" ? (
                  <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Confirmed
                  </span>
                ) : receipt?.status === "reverted" ? (
                  <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                    <XCircle className="h-3 w-3" /> Failed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-md border border-slate-500/20">
                    <Clock className="h-3 w-3" /> Unknown
                  </span>
                )}
                <a 
                  href={`${explorerBaseUrl}/tx/${txHash}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
             </div>
          ) : (
             <span className="text-slate-500 text-xs italic">No Tx Data</span>
          )}
        </div>
      </td>
    </tr>
  );
}
