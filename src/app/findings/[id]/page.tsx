import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  AlertTriangle,
  ShieldAlert,
  Lock,
  GitFork,
  CheckCircle2,
  FileCode,
  Layers,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { FindingActionPanel } from "@/components/findings/FindingActionPanel";

export const dynamic = "force-dynamic";

export default async function FindingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const finding = await db.finding.findUnique({
    where: { id: params.id },
    include: {
      repository: true,
      cryptoAsset: true,
      migrationPlans: {
        include: {
          patches: {
            include: {
              validationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!finding) {
    notFound();
  }

  const latestPlan = finding.migrationPlans[0];
  const latestPatch = latestPlan?.patches[0];
  const latestValidation = latestPatch?.validationRuns[0];

  const riskFactors = finding.riskFactors
    ? JSON.parse(finding.riskFactors)
    : [];
  const affectedDeps = finding.affectedDependencies
    ? JSON.parse(finding.affectedDependencies)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          href="/findings"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to All Findings</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono ${
                finding.severity === "CRITICAL"
                  ? "bg-red-950 text-red-400 border border-red-900"
                  : finding.severity === "HIGH"
                  ? "bg-amber-950 text-amber-400 border border-amber-900"
                  : "bg-blue-950 text-blue-400 border border-blue-900"
              }`}
            >
              {finding.severity}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              State: {finding.status}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Confidence: {Math.round(finding.confidence * 100)}%
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            {finding.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="text-cyan-400">
              {finding.file}:{finding.lineStart}-{finding.lineEnd}
            </span>
            <span>•</span>
            <span>Library: {finding.library}</span>
            <span>•</span>
            <span>Algorithm: {finding.algorithm}</span>
            {finding.keyLength && (
              <>
                <span>•</span>
                <span>Key Length: {finding.keyLength} bits</span>
              </>
            )}
          </div>
        </div>

        {/* Explainable Risk Score Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-4 text-right min-w-[180px]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Explainable Risk Score
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-1">
            {finding.riskScore}
            <span className="text-sm text-slate-500 font-normal"> / 100</span>
          </div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">
            Priority: {finding.severity}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Explainable Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Code & Quantum Risk Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Code Snippet Box */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-indigo-400" />
                <span>Detected Code Location</span>
              </span>
              <span className="text-xs font-mono text-slate-500">{finding.file}</span>
            </div>

            <div className="rounded-lg bg-[#06090f] border border-slate-800 p-4 font-mono text-xs overflow-x-auto text-slate-300">
              <pre className="whitespace-pre">
                {finding.codeSnippet}
              </pre>
            </div>
          </div>

          {/* Remediation Flow Action Panel (Plan, Patch, Validate, PR) */}
          <FindingActionPanel
            findingId={finding.id}
            repositoryId={finding.repositoryId}
            initialStatus={finding.status}
            initialPlan={latestPlan}
            initialPatch={latestPatch}
            initialValidation={latestValidation}
          />
        </div>

        {/* Right Col: Explainable Factors & Affected Dependencies */}
        <div className="lg:col-span-4 space-y-6">
          {/* Explainable Factor Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Risk Score Explanation
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Additive Factors</span>
            </div>

            <div className="space-y-2.5">
              {riskFactors.map((rf: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">{rf.factor}</span>
                    <span className="font-mono text-amber-400 font-bold">+{rf.score}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {rf.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Systems and Dependencies */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Affected Downstream Systems</span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {affectedDeps.map((dep: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono border border-slate-700"
                >
                  {dep}
                </span>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <Link
                href="/graph"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>Inspect in Dependency Graph</span>
                <GitFork className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
