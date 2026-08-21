import React from "react";
import Link from "next/link";
import { ShieldAlert, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-indigo-600 to-violet-500">
              <ShieldAlert className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-mono text-slate-400">
              AEGIS<span className="text-indigo-400">DAO</span> — AI-Assisted Governance Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/proposals" className="hover:text-slate-300 transition-colors">Proposals</Link>
            <Link href="/delegate" className="hover:text-slate-300 transition-colors">Delegate</Link>
            <Link href="/assistant" className="hover:text-slate-300 transition-colors">AI Copilot</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="font-mono text-[10px] text-slate-600">
            OpenZeppelin v5 · Sepolia Testnet · Not Audited
          </div>
        </div>
      </div>
    </footer>
  );
}
