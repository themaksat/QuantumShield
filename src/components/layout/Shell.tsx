"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  FolderGit2,
  Binary,
  AlertTriangle,
  GitFork,
  ArrowRightLeft,
  FileCheck2,
  ScrollText,
  FileBarChart,
  Settings,
  RefreshCw,
  Cpu,
  ChevronRight,
  Search,
} from "lucide-react";
import { RepositorySelector } from "./RepositorySelector";

interface ShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/inventory", label: "Crypto Inventory (CBOM)", icon: Binary },
  { href: "/findings", label: "Findings", icon: AlertTriangle },
  { href: "/graph", label: "Dependency Graph", icon: GitFork },
  { href: "/migrations", label: "Migrations & Patches", icon: ArrowRightLeft },
  { href: "/policies", label: "Policies", icon: FileCheck2 },
  { href: "/reports", label: "Executive Reports", icon: FileBarChart },
  { href: "/audit", label: "Audit Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const [isScanning, setIsScanning] = useState(false);
  const [scanToast, setScanToast] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);

  const handleQuickScan = async () => {
    try {
      setIsScanning(true);
      setScanToast({ type: "info", text: "Scanning target repository with AST static analysis..." });

      // 1. Determine active repository
      let activeRepoId = typeof window !== "undefined" ? localStorage.getItem("qs_active_repo_id") : null;
      if (!activeRepoId) {
        const repoRes = await fetch("/api/repositories");
        const repoData = await repoRes.json();
        if (repoData.repositories && repoData.repositories.length > 0) {
          activeRepoId = repoData.repositories[0].id;
        }
      }

      if (!activeRepoId) {
        throw new Error("No connected repository found. Please import a repository first.");
      }

      // 2. Fetch project ID
      const projRes = await fetch("/api/projects");
      const projData = await projRes.json();
      const projectId = projData.projects?.[0]?.id;
      if (!projectId) throw new Error("Default project could not be resolved");

      // 3. Trigger live scan
      const scanRes = await fetch(`/api/projects/${projectId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: activeRepoId }),
      });
      const scanData = await scanRes.json();
      if (!scanRes.ok) throw new Error(scanData.error || "Scan failed");

      setScanToast({
        type: "success",
        text: `Live scan complete: ${scanData.metrics?.totalAssets || 0} crypto assets found (${scanData.metrics?.quantumVulnerable || 0} quantum vulnerable). Posture score: ${scanData.postureScore}/100.`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e: any) {
      setScanToast({ type: "error", text: `Scan failed: ${e.message}` });
      setTimeout(() => setScanToast(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0d1322] flex flex-col fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-[#090d16] rounded-[7px] flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-1.5">
              QUANTUMSHIELD
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              NIST PQC Control Plane
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Platform Operations
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-cyan-400 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* NIST Standards Footer Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="p-2.5 rounded border border-slate-800 bg-[#0b0f1a] text-[11px] space-y-1">
            <div className="text-slate-400 font-medium flex items-center justify-between">
              <span>Standardized PQC</span>
              <span className="text-[10px] text-indigo-400 font-mono">FIPS</span>
            </div>
            <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
              <div>• FIPS 203: ML-KEM</div>
              <div>• FIPS 204: ML-DSA</div>
              <div>• FIPS 205: SLH-DSA</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0b101c]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Target:</span>
            <Suspense fallback={<div className="h-7 w-28 bg-slate-800/60 rounded animate-pulse" />}>
              <RepositorySelector />
            </Suspense>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleQuickScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning..." : "Trigger Full Scan"}</span>
            </button>
            <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              SE
            </div>
          </div>
        </header>

        {scanToast && (
          <div
            className={`px-8 py-3 text-xs font-mono flex items-center justify-between border-b ${
              scanToast.type === "success"
                ? "bg-emerald-950/80 border-emerald-800/80 text-emerald-300"
                : scanToast.type === "error"
                ? "bg-red-950/80 border-red-800/80 text-red-300"
                : "bg-indigo-950/80 border-indigo-800/80 text-cyan-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${scanToast.type === "info" ? "animate-spin" : ""}`} />
              <span>{scanToast.text}</span>
            </div>
            <button
              onClick={() => setScanToast(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
