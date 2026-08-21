"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface RiskScoreGaugeProps {
  score: number; // 0 - 100
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function RiskScoreGauge({ score, level, size = "md", showDetails = true }: RiskScoreGaugeProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const strokeDasharray = 283; // 2 * pi * 45
  const strokeDashoffset = strokeDasharray - (strokeDasharray * normalizedScore) / 100;

  const getColorTheme = () => {
    switch (level) {
      case "CRITICAL":
        return {
          stroke: "#ef4444",
          text: "text-red-400",
          bg: "bg-red-500/10 border-red-500/30",
          badge: "bg-red-500/20 text-red-300 border-red-500/40",
          Icon: ShieldAlert,
        };
      case "HIGH":
        return {
          stroke: "#f97316",
          text: "text-orange-400",
          bg: "bg-orange-500/10 border-orange-500/30",
          badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          Icon: AlertTriangle,
        };
      case "MEDIUM":
        return {
          stroke: "#eab308",
          text: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/30",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          Icon: Zap,
        };
      case "LOW":
      default:
        return {
          stroke: "#10b981",
          text: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/30",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          Icon: ShieldCheck,
        };
    }
  };

  const theme = getColorTheme();
  const Icon = theme.Icon;

  const dimensions = {
    sm: { box: 64, radius: 24, stroke: 4, font: "text-xs" },
    md: { box: 96, radius: 36, stroke: 6, font: "text-lg" },
    lg: { box: 140, radius: 52, stroke: 8, font: "text-2xl" },
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg
          width={dimensions.box}
          height={dimensions.box}
          viewBox="0 0 100 100"
          className="transform -rotate-90 drop-shadow-md"
        >
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth={dimensions.stroke}
            fill="none"
          />
          {/* Gauge Progress */}
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke={theme.stroke}
            strokeWidth={dimensions.stroke}
            strokeDasharray={264}
            initial={{ strokeDashoffset: 264 }}
            animate={{ strokeDashoffset: 264 - (264 * normalizedScore) / 100 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
          <span className={`font-bold ${dimensions.font} ${theme.text}`}>
            {normalizedScore}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">
            / 100
          </span>
        </div>
      </div>

      {showDetails && (
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${theme.badge}`}>
          <Icon className="h-3.5 w-3.5" />
          <span>{level} RISK</span>
        </div>
      )}
    </div>
  );
}
