import React from "react";
import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-mono text-amber-400 text-center">
      <AlertTriangle className="h-3.5 w-3.5" />
      <span>
        <strong>TESTNET ONLY:</strong> This is a reference implementation. Contracts are not audited. Not financial advice. Do not use real funds.
      </span>
    </div>
  );
}
