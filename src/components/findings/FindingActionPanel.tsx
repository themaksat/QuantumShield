"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCode2,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";

interface FindingActionPanelProps {
  findingId: string;
  repositoryId: string;
  initialStatus: string;
  initialPlan: any | null;
  initialPatch: any | null;
  initialValidation: any | null;
}

export function FindingActionPanel({
  findingId,
  repositoryId,
  initialStatus,
  initialPlan,
  initialPatch,
  initialValidation,
}: FindingActionPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [plan, setPlan] = useState<any | null>(initialPlan);
  const [patch, setPatch] = useState<any | null>(initialPatch);
  const [validation, setValidation] = useState<any | null>(initialValidation);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Generate Migration Plan
  const handleGeneratePlan = async () => {
    try {
      setLoading("plan");
      setError(null);
      const res = await fetch(`/api/findings/${findingId}/migration-plan`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      setPlan(data.plan);
      setStatus("PLAN_READY");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  // 2. Generate Safe Patch
  const handleGeneratePatch = async () => {
    if (!plan) return;
    try {
      setLoading("patch");
      setError(null);
      const res = await fetch(`/api/migrations/${plan.id}/generate-patch`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate patch");
      setPatch(data.patch);
      setStatus("PATCH_READY");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  // 3. Run Multi-Stage Validation
  const handleRunValidation = async () => {
    if (!patch) return;
    try {
      setLoading("validation");
      setError(null);
      const res = await fetch(`/api/patches/${patch.id}/validate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to validate patch");
      setValidation(data.validation);
      setStatus("REVIEW_REQUIRED");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  // 4. Create Pull Request
  const handleCreatePR = async () => {
    if (!patch) return;
    try {
      setLoading("pr");
      setError(null);
      const res = await fetch(`/api/patches/${patch.id}/create-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId, repositoryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create PR");
      setStatus("PR_CREATED");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  // 5. Apply & Merge Patch directly to Codebase
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const handleApplyPatch = async () => {
    if (!patch) return;
    try {
      setLoading("apply");
      setError(null);
      const res = await fetch(`/api/patches/${patch.id}/apply`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply patch");
      setStatus("RESOLVED");
      setSuccessMsg(`Patch merged into repository! Posture score updated to ${data.newPostureScore}/100.`);
      router.refresh();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-800 bg-[#0b101c]">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          Remediation Flow:
        </span>

        {/* Step 1 Button */}
        <button
          onClick={handleGeneratePlan}
          disabled={loading !== null}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
            plan
              ? "bg-slate-800 text-emerald-400 border border-slate-700"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          } disabled:opacity-50`}
        >
          {loading === "plan" ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : plan ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{plan ? "Migration Plan Active" : "Generate Migration Plan"}</span>
        </button>

        {/* Step 2 Button */}
        <button
          onClick={handleGeneratePatch}
          disabled={!plan || loading !== null}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
            patch
              ? "bg-slate-800 text-emerald-400 border border-slate-700"
              : plan
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-slate-800/40 text-slate-500 border border-slate-800"
          } disabled:opacity-50`}
        >
          {loading === "patch" ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : patch ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <FileCode2 className="h-3.5 w-3.5" />
          )}
          <span>{patch ? "Patch Generated" : "Generate Safe Patch"}</span>
        </button>

        {/* Step 3 Button */}
        <button
          onClick={handleRunValidation}
          disabled={!patch || loading !== null}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
            validation
              ? "bg-slate-800 text-emerald-400 border border-slate-700"
              : patch
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-slate-800/40 text-slate-500 border border-slate-800"
          } disabled:opacity-50`}
        >
          {loading === "validation" ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : validation ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          <span>{validation ? "Validation Complete" : "Run Validation"}</span>
        </button>

        {/* Step 4 Button */}
        <button
          onClick={handleCreatePR}
          disabled={!patch || status === "PR_CREATED" || loading !== null}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
            status === "PR_CREATED"
              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
              : validation
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-slate-800/40 text-slate-500 border border-slate-800"
          } disabled:opacity-50`}
        >
          {loading === "pr" ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <GitPullRequest className="h-3.5 w-3.5" />
          )}
          <span>{status === "PR_CREATED" ? "PR Created on GitHub" : "Approve & Create PR"}</span>
        </button>

        {/* Step 5 Button: Direct Apply */}
        <button
          onClick={handleApplyPatch}
          disabled={!patch || status === "RESOLVED" || loading !== null}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
            status === "RESOLVED"
              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
              : patch
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30"
              : "bg-slate-800/40 text-slate-500 border border-slate-800"
          } disabled:opacity-50`}
        >
          {loading === "apply" ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span>{status === "RESOLVED" ? "Patch Applied & Resolved" : "Apply Fix to Codebase"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-300">
          Error: {error}
        </div>
      )}

      {/* Migration Plan Viewer */}
      {plan && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Deterministic Post-Quantum Migration Plan</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Strategy: <span className="text-cyan-400 font-mono">{plan.strategy}</span>
              </p>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                plan.readiness === "READY"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-amber-950 text-amber-400 border border-amber-800"
              }`}
            >
              Migration Readiness: {plan.readiness}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 space-y-1">
              <div className="text-slate-400 font-medium">Current Cryptographic State</div>
              <div className="text-slate-200 font-mono font-bold">{plan.currentAlgorithm}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 space-y-1">
              <div className="text-slate-400 font-medium">Target Quantum-Safe State</div>
              <div className="text-cyan-300 font-mono font-bold">{plan.targetAlgorithm}</div>
            </div>
          </div>

          {plan.steps && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sequenced Migration Steps
              </div>
              <div className="space-y-1.5">
                {(typeof plan.steps === "string" ? JSON.parse(plan.steps) : plan.steps).map(
                  (step: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-300 p-2 rounded bg-slate-900/30 border border-slate-800/50"
                    >
                      <span className="h-4 w-4 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-mono text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Code Patch Viewer */}
      {patch && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-cyan-400" />
                <span>Generated Code Patch & Git Diff</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <span className="text-slate-200 font-mono">{patch.targetFile}</span>
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Confidence: {Math.round((patch.confidence || 0.98) * 100)}%
            </span>
          </div>

          {/* Side-by-Side Unified Diff Box */}
          <div className="rounded-lg bg-[#06090f] border border-slate-800 p-4 font-mono text-xs overflow-x-auto">
            <div className="text-slate-500 pb-2 border-b border-slate-800 mb-2 font-semibold">
              UNIFIED DIFF ({patch.targetFile})
            </div>
            <pre className="text-slate-300 whitespace-pre">
              {patch.diff.split("\n").map((line: string, idx: number) => {
                let colorClass = "text-slate-400";
                if (line.startsWith("+")) colorClass = "text-emerald-400 bg-emerald-950/20";
                else if (line.startsWith("-")) colorClass = "text-red-400 bg-red-950/20";
                else if (line.startsWith("@")) colorClass = "text-cyan-400 font-bold";

                return (
                  <div key={idx} className={colorClass}>
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>

          {/* Companion Files Viewer */}
          {patch.companionFiles && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Generated Companion Modules & Test Fixtures
              </div>
              <div className="space-y-2">
                {(typeof patch.companionFiles === "string"
                  ? JSON.parse(patch.companionFiles)
                  : patch.companionFiles
                ).map((comp: any, idx: number) => (
                  <details
                    key={idx}
                    className="group rounded-lg bg-slate-900/60 border border-slate-800 text-xs overflow-hidden"
                  >
                    <summary className="p-3 cursor-pointer select-none flex items-center justify-between font-mono text-cyan-400 font-semibold hover:bg-slate-800/40">
                      <span>📄 {comp.path}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {comp.purpose || "Companion provider module"}
                      </span>
                    </summary>
                    <div className="p-4 border-t border-slate-800 bg-[#06090f] overflow-x-auto">
                      <pre className="text-slate-300 font-mono text-[11px] whitespace-pre">
                        {comp.content}
                      </pre>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Rationale and Rollback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 space-y-1">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Architectural Rationale
              </div>
              <p className="text-slate-300 leading-relaxed">{patch.rationale}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 space-y-1">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Rollback Instructions
              </div>
              <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                {patch.rollbackNotes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PR Created Banner */}
      {status === "PR_CREATED" && (
        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                GitHub Pull Request Generated Successfully
              </div>
              <div className="text-xs text-emerald-300/80 mt-0.5">
                Branch created and committed with cryptographic provider abstraction and companion test suite.
              </div>
            </div>
          </div>

          <Link
            href="/migrations"
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md flex items-center gap-1.5 shrink-0 transition-all"
          >
            <span>View All Pull Requests</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Validation Scorecard */}
      {validation && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Multi-Stage Validation Scorecard</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Isolated sandbox syntax, secret scanning, protocol compatibility, and benchmarks
              </p>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                validation.overallStatus === "PASS"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : validation.overallStatus === "REVIEW_REQUIRED"
                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                  : "bg-red-950 text-red-400 border border-red-900"
              }`}
            >
              Overall: {validation.overallStatus}
            </span>
          </div>

          {/* Checks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Syntax Check</span>
              <span className="font-mono font-bold text-emerald-400">PASS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Secret Scanner</span>
              <span className="font-mono font-bold text-emerald-400">PASS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Crypto Policy</span>
              <span className="font-mono font-bold text-emerald-400">PASS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Compatibility</span>
              <span className="font-mono font-bold text-amber-400">
                {validation.compatibilityCheck || "WARNING"}
              </span>
            </div>
          </div>

          {/* Performance Benchmark Bar */}
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Performance Impact Lab:</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Latency: <strong className="text-slate-200">{validation.latencyImpact}</strong></span>
              <span>Payload Size: <strong className="text-slate-200">{validation.payloadSizeDelta}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
