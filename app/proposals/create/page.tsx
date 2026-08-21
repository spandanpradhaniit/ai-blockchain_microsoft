"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AEGIS_GOVERNOR_ABI, AEGIS_DAO_ABI, CONTRACT_ADDRESSES } from "@/lib/config";
import { ProposalAnalyzer, ProposalFormData } from "@/components/ProposalAnalyzer";
import { AIRiskReportCard } from "@/components/AIRiskReportCard";
import { ProposalRiskAnalysis } from "@/lib/ai";
import {
  PlusCircle,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Send,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

export default function CreateProposalWizardPage() {
  const router = useRouter();
  const { isConnected, address, chain } = useAccount();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form payload
  const [formData, setFormData] = useState<ProposalFormData | null>(null);

  // AI & IPFS Result
  const [riskAnalysis, setRiskAnalysis] = useState<ProposalRiskAnalysis | null>(null);
  const [ipfsCid, setIpfsCid] = useState("");
  const [oracleSignature, setOracleSignature] = useState<string | null>(null);
  const [oracleAddress, setOracleAddress] = useState<string | null>(null);

  // Status flags
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Contract execution via Wagmi
  const { writeContractAsync, data: txHash, isPending: isWriting, error: writeError } = useWriteContract();

  // Transaction Receipt monitoring
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Dynamic Block Explorer URL from chain config
  const explorerBaseUrl = chain?.blockExplorers?.default?.url || "https://sepolia.etherscan.io";

  // Step 1: Handle Form Submit -> Call /api/analyze-proposal
  const handleAnalyzeProposal = async (data: ProposalFormData) => {
    setFormData(data);
    setIsAuditing(true);
    setAuditError(null);

    try {
      const weiValue = (parseFloat(data.ethValue || "0") * 1e18).toString();

      const res = await fetch("/api/analyze-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          amount: weiValue,
          recipient: data.targetAddress,
          text: data.description,
        }),
      });

      if (res.status === 429) {
        throw new Error("Rate limit exceeded. Maximum 10 requests per minute allowed.");
      }
      if (res.status === 400) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Validation failed on server.");
      }
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setRiskAnalysis(json.evaluation);
      setIpfsCid(json.ipfsCid || "");
      setOracleSignature(json.signature);
      setOracleAddress(json.oracleAddress);

      setStep(2);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setAuditError(err.message || "Failed to analyze proposal");
    } finally {
      setIsAuditing(false);
    }
  };

  // Step 2: Call createProposal on-chain via Wagmi
  const handleDeployOnChain = async () => {
    if (!formData || !riskAnalysis) return;

    try {
      const weiValue = (parseFloat(formData.ethValue || "0") * 1e18).toString();
      const governorAddr = (CONTRACT_ADDRESSES as any)[chain?.name?.toLowerCase() || "sepolia"]?.governor || CONTRACT_ADDRESSES.sepolia.governor;

      let hash: `0x${string}`;

      if (oracleSignature) {
        // Use proposeWithAttestation / createProposal with verified signature
        hash = await writeContractAsync({
          address: governorAddr as `0x${string}`,
          abi: AEGIS_GOVERNOR_ABI,
          functionName: "proposeWithAttestation",
          args: [
            [formData.targetAddress as `0x${string}`],
            [BigInt(weiValue)],
            [formData.calldataHex as `0x${string}`],
            formData.title,
            formData.title,
            BigInt(weiValue),
            ipfsCid,
            riskAnalysis.riskScore,
            oracleSignature as `0x${string}`,
          ],
        });
      } else {
        // Standard propose fallback
        hash = await writeContractAsync({
          address: governorAddr as `0x${string}`,
          abi: AEGIS_GOVERNOR_ABI,
          functionName: "propose",
          args: [
            [formData.targetAddress as `0x${string}`],
            [BigInt(weiValue)],
            [formData.calldataHex as `0x${string}`],
            formData.title,
          ],
        });
      }

      // Index proposal into storage
      await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Date.now().toString(),
          proposer: address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          targets: [formData.targetAddress],
          values: [weiValue],
          signatures: [formData.functionSignature],
          calldatas: [formData.calldataHex],
          title: formData.title,
          description: formData.description,
          ipfsCid,
          riskAnalysis,
          txHash: hash,
        }),
      });

      setStep(3);
    } catch (err: any) {
      console.error("On-chain deploy error:", err);
    }
  };

  // Decode plain language revert reason
  const getPlainLanguageError = () => {
    const rawErr = (writeError || receiptError)?.message || "";
    if (rawErr.includes("InvalidOracleSignature")) return "Oracle signature verification failed on-chain.";
    if (rawErr.includes("User rejected")) return "Transaction rejected in wallet.";
    if (rawErr.includes("InsufficientTreasuryBalance")) return "Insufficient treasury funds.";
    if (rawErr.includes("StringTooLong")) return "Proposal title or IPFS hash string length exceeded limit.";
    return rawErr || "Transaction failed or reverted.";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Wizard Progress Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono mb-2">
          <PlusCircle className="h-6 w-6 text-indigo-400" /> Create AegisDAO Proposal
        </h1>
        <p className="text-xs text-slate-400">
          Guided 3-step proposal creation with AI threat audit, IPFS metadata pinning, and OpenZeppelin v5 contract targets.
        </p>

        {/* Step Badges */}
        <div className="grid grid-cols-3 gap-2 mt-6 font-mono text-xs">
          {[
            { num: 1, label: "Form & Payload" },
            { num: 2, label: "AI Audit & Signature" },
            { num: 3, label: "On-Chain Deployment" },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                step === s.num
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold"
                  : step > s.num
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-slate-950 flex items-center justify-center text-[10px]">
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Form Inputs & Demo Mode */}
      {step === 1 && (
        <div className="space-y-4">
          {auditError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-xs text-red-300">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span>{auditError}</span>
            </div>
          )}
          <ProposalAnalyzer
            onSubmit={handleAnalyzeProposal}
            onDraftAi={async (prompt, category) => {
              const res = await fetch("/api/ai/draft-proposal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, category }),
              });
              return res.json();
            }}
            isSubmitting={isAuditing}
          />
        </div>
      )}

      {/* Step 2: AIRiskReportCard & Deploy Button */}
      {step === 2 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="h-4 w-4 text-indigo-400" /> Step 2: AI Security Audit & Oracle Signature
          </h3>

          <AIRiskReportCard
            analysis={riskAnalysis}
            ipfsCid={ipfsCid}
            signature={oracleSignature}
            loading={isAuditing}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Edit Proposal
            </button>

            <button
              onClick={handleDeployOnChain}
              disabled={!riskAnalysis || !oracleSignature || isWriting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isWriting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Confirming in Wallet...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Deploy Proposal On-Chain
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Transaction Progress & Confirmation */}
      {step === 3 && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6 text-center">
          {isConfirming && (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-12 w-12 text-indigo-400 animate-spin" />
              <h3 className="text-xl font-bold text-white">Broadcasting Proposal On-Chain...</h3>
              <p className="text-xs text-slate-400">Waiting for block confirmation on {chain?.name || "Sepolia"}.</p>
            </div>
          )}

          {isConfirmed && (
            <div className="space-y-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 animate-bounce" />
              <h3 className="text-xl font-bold text-white">Proposal Successfully Deployed!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Your proposal is live on-chain. Voting will open after the voting delay.
              </p>
            </div>
          )}

          {(writeError || receiptError) && (
            <div className="space-y-4 bg-red-500/10 p-6 rounded-2xl border border-red-500/30">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="text-xl font-bold text-red-300">Transaction Reverted</h3>
              <p className="text-xs text-red-200 font-mono max-w-md mx-auto">
                {getPlainLanguageError()}
              </p>
            </div>
          )}

          {/* Details & Explorer Link */}
          {txHash && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-left space-y-2 max-w-md mx-auto">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Transaction Hash:</span>
                <span className="text-emerald-400 break-all">{txHash}</span>
              </div>
              <div className="pt-2">
                <a
                  href={`${explorerBaseUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View on {chain?.name || "Block"} Explorer <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => router.push("/proposals")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all"
            >
              View Proposals Directory <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
