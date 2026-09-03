import React from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
  FileCode2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function MigrationsPage() {
  const { demoRepo } = await ensureDefaultProject();

  const patches = await db.patch.findMany({
    where: { repositoryId: demoRepo.id },
    include: {
      finding: true,
      migrationPlan: true,
      validationRuns: { orderBy: { createdAt: "desc" }, take: 1 },
      pullRequests: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const pullRequests = await db.pullRequest.findMany({
    where: { repositoryId: demoRepo.id },
    include: {
      patch: { include: { finding: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Migrations, Patches & Pull Requests
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review safe cryptographic refactorings, multi-stage validation scorecards, and GitHub pull requests.
          </p>
        </div>
      </div>

      {/* Pull Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-emerald-400" />
            <span>Generated Pull Requests ({pullRequests.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {pullRequests.map((pr) => (
            <div
              key={pr.id}
              className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-xs border border-emerald-800/60 font-bold">
                    PR #{pr.prNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                    {pr.branchName}
                  </span>
                  <h3 className="text-sm font-bold text-white">{pr.title}</h3>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Target: {pr.patch.targetFile} • Status:{" "}
                  <span className="text-emerald-400 font-bold">{pr.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/findings/${pr.patch.findingId}`}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
                >
                  View Patch & Diff
                </Link>
                {pr.prUrl && (
                  <a
                    href={pr.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Inspect GitHub PR</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Patches List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-cyan-400" />
          <span>Active Code Patches & Validations ({patches.length})</span>
        </h2>

        <div className="space-y-3">
          {patches.map((p) => {
            const val = p.validationRuns[0];
            return (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Status: {p.status}
                    </span>
                    <span className="text-sm font-bold text-white font-mono">
                      {p.targetFile}
                    </span>
                  </div>

                  <Link
                    href={`/findings/${p.findingId}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <span>Open Finding Details</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <p className="text-xs text-slate-400">{p.rationale}</p>

                {val && (
                  <div className="flex items-center gap-4 text-xs font-mono bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">
                      Verdict:{" "}
                      <strong
                        className={
                          val.status === "PASS"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {val.status}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      Syntax: <strong className="text-emerald-400">{val.syntaxCheck}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      Secrets: <strong className="text-emerald-400">{val.secretScanCheck}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      Latency Impact: <strong className="text-slate-200">{val.latencyImpact}</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
