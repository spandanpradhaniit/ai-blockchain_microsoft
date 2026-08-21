"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProposalCard } from "@/components/ui/ProposalCard";
import { IndexedProposal } from "@/lib/indexer/store";
import { Vote, Search, PlusCircle, Filter } from "lucide-react";

export default function ProposalsDirectoryPage() {
  const [proposals, setProposals] = useState<IndexedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const stateTabs = ["All", "Active", "Queued", "Executed", "Defeated"];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedState !== "All") params.set("state", selectedState);
    if (searchQuery) params.set("search", searchQuery);

    fetch(`/api/proposals?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProposals(data.proposals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedState, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
            <Vote className="h-6 w-6 text-indigo-400" /> AegisDAO Governance Proposals
          </h1>
          <p className="text-xs text-slate-400">
            Browse indexed proposal history, cast votes, and review AI security audits.
          </p>
        </div>

        <Link
          href="/proposals/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all self-start md:self-auto"
        >
          <PlusCircle className="h-4 w-4" /> Create Proposal
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-3 rounded-2xl border border-slate-800">
        
        {/* State Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
          {stateTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedState(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors font-mono ${
                selectedState === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, proposer, or ID..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

      </div>

      {/* Proposals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800 space-y-3">
          <Filter className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No Proposals Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No proposal matched your current filter criteria. Try clearing search filters or create a new proposal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

    </div>
  );
}
