"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Loader2, Sparkles, Code2, ArrowRight } from "lucide-react";

// Zod Schema for the form
const proposalSchema = z.object({
  category: z.enum(["grant", "parameter_change", "emergency_pause", "general"]),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description cannot exceed 2000 characters"),
  targetAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
  ethValue: z.string().regex(/^\d*\.?\d+$/, "Must be a valid ETH amount"),
  functionSignature: z.string().min(1, "Function signature is required"),
  calldataHex: z.string().regex(/^0x[a-fA-F0-9]*$/, "Must be valid hex data starting with 0x")
});

export type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalAnalyzerProps {
  onSubmit: (data: ProposalFormData) => void;
  onDraftAi: (prompt: string, category: string) => Promise<{ title?: string; description?: string }>;
  isSubmitting?: boolean;
}

export function ProposalAnalyzer({ onSubmit, onDraftAi, isSubmitting = false }: ProposalAnalyzerProps) {
  const [formData, setFormData] = useState<ProposalFormData>({
    category: "grant",
    title: "",
    description: "",
    targetAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    ethValue: "1.0",
    functionSignature: "releaseGrant(address recipient, uint256 amount, string reason)",
    calldataHex: "0x9b3293ca"
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProposalFormData, string>>>({});
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const handleChange = (field: keyof ProposalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAiDraft = async () => {
    if (!formData.title && !formData.description) return;
    setIsAiDrafting(true);
    try {
      const result = await onDraftAi(formData.title || formData.description, formData.category);
      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          description: result.description || prev.description
        }));
      }
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = proposalSchema.safeParse(formData);
    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          formattedErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }
    onSubmit(validation.data);
  };

  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleDemoPrefill = () => {
    setIsDemoMode(true);
    setFormData({
      category: "grant",
      title: "[DEMO] AIP-99: Liquidity Pool Optimization & Vault Migration",
      description: "SYNTHETIC TEST CASE: Disguised treasury drain exploit. This proposal purports to rebalance liquidity into a new pool, but the calldata actually executes a transferOwnership(address) to an unverified external contract 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC.",
      targetAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      ethValue: "10.0",
      functionSignature: "transferOwnership(address newOwner)",
      calldataHex: "0xf2fde38b00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8"
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isDemoMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-400 font-mono">
          <span className="flex items-center gap-2 font-bold">
            <Sparkles className="h-4 w-4" /> DEMO DATA / SYNTHETIC MALICIOUS PAYLOAD LOADED
          </span>
          <button
            type="button"
            onClick={() => setIsDemoMode(false)}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700"
          >
            Clear Demo
          </button>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">Metadata</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDemoPrefill}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Load Malicious Demo</span>
            </button>
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={isAiDrafting || (!formData.title && !formData.description)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 disabled:opacity-50 transition-colors"
            >
              {isAiDrafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-400" />}
              <span>AI Draft Assistant</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="grant">Ecosystem Grant / Treasury Funding</option>
            <option value="parameter_change">Governance Parameter Optimization</option>
            <option value="emergency_pause">Emergency Response / Security Protocol</option>
            <option value="general">General Community Initiative</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between">
            <label className="block text-xs font-medium text-slate-400 mb-1">Proposal Title</label>
            <span className="text-[10px] text-slate-500">{formData.title.length}/100</span>
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., AIP-4: Treasury Grant for Security Audits"
            className={`w-full rounded-xl border bg-slate-950 p-3 text-xs text-white placeholder-slate-600 focus:outline-none disabled:opacity-50 ${errors.title ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'}`}
          />
          {errors.title && <span className="text-red-400 text-[10px] mt-1">{errors.title}</span>}
        </div>

        <div>
           <div className="flex justify-between">
            <label className="block text-xs font-medium text-slate-400 mb-1">Detailed Description & Rationale</label>
            <span className="text-[10px] text-slate-500">{formData.description.length}/2000</span>
          </div>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            disabled={isSubmitting}
            placeholder="Explain the background, goals, implementation steps..."
            className={`w-full rounded-xl border bg-slate-950 p-3 text-xs text-white placeholder-slate-600 focus:outline-none disabled:opacity-50 ${errors.description ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'}`}
          />
          {errors.description && <span className="text-red-400 text-[10px] mt-1">{errors.description}</span>}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Code2 className="h-4 w-4 text-indigo-400" /> On-Chain Payload
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Target Contract Address</label>
            <input
              type="text"
              value={formData.targetAddress}
              onChange={(e) => handleChange("targetAddress", e.target.value)}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-slate-950 p-3 text-xs text-white focus:outline-none disabled:opacity-50 ${errors.targetAddress ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'}`}
            />
            {errors.targetAddress && <span className="text-red-400 text-[10px] mt-1">{errors.targetAddress}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Native Value (ETH)</label>
            <input
              type="text"
              value={formData.ethValue}
              onChange={(e) => handleChange("ethValue", e.target.value)}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-slate-950 p-3 text-xs text-white focus:outline-none disabled:opacity-50 ${errors.ethValue ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'}`}
            />
            {errors.ethValue && <span className="text-red-400 text-[10px] mt-1">{errors.ethValue}</span>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Function Signature</label>
            <input
              type="text"
              value={formData.functionSignature}
              onChange={(e) => handleChange("functionSignature", e.target.value)}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-slate-950 p-3 text-xs text-white focus:outline-none disabled:opacity-50 ${errors.functionSignature ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'}`}
            />
            {errors.functionSignature && <span className="text-red-400 text-[10px] mt-1">{errors.functionSignature}</span>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Encoded Calldata Hex</label>
            <input
              type="text"
              value={formData.calldataHex}
              onChange={(e) => handleChange("calldataHex", e.target.value)}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-slate-950 p-3 text-xs text-white focus:outline-none disabled:opacity-50 ${errors.calldataHex ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'}`}
            />
            {errors.calldataHex && <span className="text-red-400 text-[10px] mt-1">{errors.calldataHex}</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Analyze Risk & Proceed</span>}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
