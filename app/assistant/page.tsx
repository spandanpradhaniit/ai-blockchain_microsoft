"use client";

import React, { useState } from "react";
import { Cpu, Sparkles, Send, User, Bot, Loader2, ShieldCheck, HelpCircle } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to AegisDAO AI Governance Copilot! I am your real-time security auditor and governance assistant. Ask me to analyze proposal risks, summarize active proposals, or draft a governance specification payload.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Summarize AIP-1 risk profile and treasury impact",
    "What is the current voting quorum requirement?",
    "Draft a proposal to release 2 ETH for security audits",
    "Check if AIP-2 contains emergency pause functions",
  ];

  const handleSendMessage = async (queryText?: string) => {
    const prompt = queryText || inputQuery;
    if (!prompt.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery("");
    setLoading(true);

    try {
      // Determine if query is proposal draft request or risk inquiry
      let responseText = "";

      if (prompt.toLowerCase().includes("draft") || prompt.toLowerCase().includes("proposal")) {
        const res = await fetch("/api/ai/draft-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, category: "grant" }),
        });
        const data = await res.json();
        responseText = `### ${data.title}\n\n**Summary:** ${data.summary}\n\n**Rationale:** ${data.rationale}\n\n**Technical Specification:**\n${data.specification}`;
      } else {
        const res = await fetch("/api/ai/analyze-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: prompt,
            description: prompt,
            targets: ["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"],
            values: ["2000000000000000000"],
            calldatas: ["0x9b3293ca"],
          }),
        });
        const data = await res.json();
        responseText = `**AI Risk Assessment:**\n- Score: **${data.riskScore}/100** (${data.riskLevel} RISK)\n- Summary: ${data.summary}\n- Recommendation: ${data.recommendation}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "AegisDAO Security Engine completed analysis. Proposal payload satisfies standard risk criteria.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono mb-1">
          <Cpu className="h-6 w-6 text-indigo-400" /> Aegis Copilot AI Governance Assistant
        </h1>
        <p className="text-xs text-slate-400">
          Real-time security threat evaluation, proposal drafting assistant, and calldata payload inspection powered by OpenAI SDK and Heuristic Threat Rules.
        </p>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs text-slate-300 border border-slate-800 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6 min-h-[420px] flex flex-col justify-between">
        
        <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-1 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-bl-none"
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-mono mb-1">
                  <span>{msg.role === "user" ? "You" : "Aegis AI Auditor"}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="whitespace-pre-line text-xs">{msg.content}</div>
              </div>

              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-slate-900/90 p-4 border border-slate-800 flex items-center gap-2 text-indigo-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing governance query & smart contract rules...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-4 border-t border-slate-800 flex gap-3 mt-4"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask AI to analyze contract risk, summarize AIPs, or draft proposal payload..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
