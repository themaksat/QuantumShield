"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  Search,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  GitCompare,
  Filter,
  X,
  Sparkles,
} from "lucide-react";

export interface CBOMComponentItem {
  id: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  language: string;
  assetType: string;
  algorithm: string;
  keySize: number | null;
  mode: string | null;
  library: string;
  purpose: string;
  quantumVulnerable: boolean;
  riskScore: number;
  confidence: number;
  migrationStatus: string;
  recommendedStrategy: string | null;
  findingId?: string | null;
}

interface CBOMTableClientProps {
  projectId: string;
  repoName: string;
  scanId: string;
  components: CBOMComponentItem[];
}

export function CBOMTableClient({
  projectId,
  repoName,
  scanId,
  components,
}: CBOMTableClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("ALL");
  const [vulnFilter, setVulnFilter] = useState<"ALL" | "VULNERABLE" | "SAFE">("ALL");
  const [sortBy, setSortBy] = useState<"risk" | "algo" | "location">("risk");
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffData, setDiffData] = useState<any | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // Filter components
  const filtered = components.filter((item) => {
    const matchesSearch =
      item.algorithm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.library.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      assetTypeFilter === "ALL" || item.assetType === assetTypeFilter;

    const matchesVuln =
      vulnFilter === "ALL"
        ? true
        : vulnFilter === "VULNERABLE"
        ? item.quantumVulnerable
        : !item.quantumVulnerable;

    return matchesSearch && matchesType && matchesVuln;
  });

  // Sort components
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "risk") return b.riskScore - a.riskScore;
    if (sortBy === "algo") return a.algorithm.localeCompare(b.algorithm);
    return a.file.localeCompare(b.file);
  });

  const assetTypes = Array.from(new Set(components.map((c) => c.assetType)));

  // Fetch live diff
  const handleOpenDiff = async () => {
    setIsDiffModalOpen(true);
    try {
      setDiffLoading(true);
      const res = await fetch(`/api/projects/${projectId}/cbom/diff`);
      const data = await res.json();
      setDiffData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDiffLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search algorithm, file, library, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {assetTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Vulnerability Segment */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800 text-xs">
            <button
              onClick={() => setVulnFilter("ALL")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                vulnFilter === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({components.length})
            </button>
            <button
              onClick={() => setVulnFilter("VULNERABLE")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                vulnFilter === "VULNERABLE"
                  ? "bg-red-950 text-red-300 border border-red-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Vulnerable ({components.filter((c) => c.quantumVulnerable).length})
            </button>
            <button
              onClick={() => setVulnFilter("SAFE")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                vulnFilter === "SAFE"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Quantum Safe ({components.filter((c) => !c.quantumVulnerable).length})
            </button>
          </div>
        </div>

        {/* Action Buttons: Diff & Exports */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDiff}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <GitCompare className="h-3.5 w-3.5 text-cyan-400" />
            <span>CBOM Diff</span>
          </button>

          <a
            href={`/api/projects/${projectId}/cbom/export?format=csv`}
            download
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>CSV</span>
          </a>

          <a
            href={`/api/projects/${projectId}/cbom/export?format=json`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CycloneDX JSON</span>
          </a>
        </div>
      </div>

      {/* CBOM Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            CBOM Asset Records
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Showing {sorted.length} of {components.length} assets
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Algorithm & Key</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Library</th>
                <th className="py-3 px-4">Quantum Vulnerable</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                    {asset.id.split("_").slice(-2).join("_")}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{asset.algorithm}</span>
                      {asset.keySize && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                          {asset.keySize}-bit
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                      {asset.purpose}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/60 text-[11px]">
                      {asset.assetType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    <div>{asset.file}</div>
                    <div className="text-[10px] text-slate-500">
                      L{asset.lineStart}:{asset.lineEnd} • {asset.language}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-indigo-400">
                    {asset.library}
                  </td>
                  <td className="py-3.5 px-4">
                    {asset.quantumVulnerable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/60">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Vulnerable</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Quantum Safe</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-200">
                      {asset.riskScore}
                      <span className="text-slate-500 font-normal">/100</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {asset.findingId ? (
                      <Link
                        href={`/findings/${asset.findingId}`}
                        className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 group"
                      >
                        <span>Remediate</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CBOM Diff Modal */}
      {isDiffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn space-y-4">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">CBOM Version-to-Version Diff Viewer</h3>
              </div>
              <button
                onClick={() => setIsDiffModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {diffLoading ? (
                <div className="text-center py-8 text-slate-400 font-mono">
                  Comparing recent scans...
                </div>
              ) : diffData?.hasDiff ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded bg-slate-900 border border-slate-800 font-mono">
                    <span>Posture Score Delta:</span>
                    <strong
                      className={
                        diffData.postureDelta >= 0 ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      {diffData.postureDelta >= 0
                        ? `+${diffData.postureDelta}`
                        : diffData.postureDelta}{" "}
                      points
                    </strong>
                  </div>

                  {diffData.added && diffData.added.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-semibold text-amber-400 uppercase tracking-wider text-[11px]">
                        Newly Introduced Cryptography ({diffData.added.length})
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {diffData.added.map((a: any, i: number) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-amber-950/20 border border-amber-900/40 text-amber-200 font-mono flex justify-between"
                          >
                            <span>{a.algorithm} ({a.file})</span>
                            <span>{a.riskScore}/100</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diffData.removed && diffData.removed.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                        Remediated / Retired Cryptography ({diffData.removed.length})
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {diffData.removed.map((r: any, i: number) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 font-mono flex justify-between"
                          >
                            <span>{r.algorithm} ({r.file})</span>
                            <span>REMEDIATED</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center text-slate-400 leading-relaxed">
                  {diffData?.message ||
                    "Initial baseline scan recorded. Run another scan using 'Trigger Full Scan' to view cryptographic diffs and regression tracking."}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setIsDiffModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
