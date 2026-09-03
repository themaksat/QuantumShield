"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Lock,
} from "lucide-react";

export interface FindingListItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  algorithm: string;
  keyLength: number | null;
  library: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  riskScore: number;
  confidence: number;
  migrationComplexity: string;
  recommendedStrategy: string;
  hasPlan: boolean;
  hasPatch: boolean;
  hasPr: boolean;
}

interface FindingsListClientProps {
  findings: FindingListItem[];
}

export function FindingsListClient({ findings }: FindingsListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = findings.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.algorithm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.library.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" || f.severity === severityFilter;

    const matchesStatus =
      statusFilter === "ALL" || f.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[260px]">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by vulnerability, algorithm, file, library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All States</option>
            <option value="DISCOVERED">DISCOVERED</option>
            <option value="PLAN_READY">PLAN_READY</option>
            <option value="PATCH_READY">PATCH_READY</option>
            <option value="REVIEW_REQUIRED">REVIEW_REQUIRED</option>
            <option value="PR_CREATED">PR_CREATED</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-slate-200">{filtered.length}</strong> of {findings.length} findings
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filtered.map((f) => (
          <div
            key={f.id}
            className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 hover:border-indigo-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    f.severity === "CRITICAL"
                      ? "bg-red-950 text-red-400 border border-red-900"
                      : f.severity === "HIGH"
                      ? "bg-amber-950 text-amber-400 border border-amber-900"
                      : "bg-blue-950 text-blue-400 border border-blue-900"
                  }`}
                >
                  {f.severity}
                </span>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    f.status === "PR_CREATED"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                      : f.status === "PATCH_READY" || f.status === "REVIEW_REQUIRED"
                      ? "bg-cyan-950 text-cyan-400 border border-cyan-800/50"
                      : f.status === "PLAN_READY"
                      ? "bg-indigo-950 text-indigo-400 border border-indigo-800/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {f.status}
                </span>

                <h3 className="text-sm font-bold text-white hover:text-cyan-300">
                  <Link href={`/findings/${f.id}`}>{f.title}</Link>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                <span>
                  {f.file}:{f.lineStart}-{f.lineEnd}
                </span>
                <span>•</span>
                <span>{f.library}</span>
                <span>•</span>
                <span>Confidence: {Math.round(f.confidence * 100)}%</span>
                <span>•</span>
                <span>Complexity: {f.migrationComplexity}</span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-1">
                {f.recommendedStrategy}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right min-w-[70px]">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Risk Score
                </div>
                <div className="text-2xl font-bold font-mono text-slate-200">
                  {f.riskScore}
                  <span className="text-sm text-slate-500 font-normal">/100</span>
                </div>
              </div>

              <Link
                href={`/findings/${f.id}`}
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all shrink-0"
              >
                <span>Inspect & Remediate</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
