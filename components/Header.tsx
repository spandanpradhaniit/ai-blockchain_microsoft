"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldAlert, Vote, Cpu, UserCheck, LayoutDashboard, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/proposals", label: "Proposals", icon: Vote },
    { href: "/delegate", label: "Delegation", icon: UserCheck },
    { href: "/assistant", label: "AI Copilot", icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <ShieldAlert className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white font-mono">
                AEGIS<span className="text-indigo-400">DAO</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-2.5 w-2.5" /> AI Engine
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Risk-Gated Governance</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-full border border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full transition-colors ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-full bg-indigo-600/30 border border-indigo-500/50"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <Icon className="h-3.5 w-3.5 z-10" />
                <span className="z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet Connect */}
        <div className="flex items-center gap-3">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
          />
        </div>
      </div>
    </header>
  );
}
