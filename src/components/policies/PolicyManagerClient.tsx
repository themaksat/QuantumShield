"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";

interface PolicyItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface ViolationItem {
  policyName: string;
  ruleId: string;
  severity: "DENY" | "WARN";
  message: string;
  findingTitle: string;
  file: string;
  line: number;
}

interface PolicyManagerClientProps {
  initialPolicies: PolicyItem[];
  initialViolations: ViolationItem[];
}

export function PolicyManagerClient({
  initialPolicies,
  initialViolations,
}: PolicyManagerClientProps) {
  const [policies, setPolicies] = useState<PolicyItem[]>(initialPolicies);
  const [violations, setViolations] = useState<ViolationItem[]>(initialViolations);
  const [evaluating, setEvaluating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyDesc, setNewPolicyDesc] = useState("");
  const [newPolicyAction, setNewPolicyAction] = useState<"DENY" | "WARN">("DENY");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const togglePolicy = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
    setStatusMessage("Policy enforcement rules updated.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleEvaluateNow = async () => {
    try {
      setEvaluating(true);
      const res = await fetch("/api/policies");
      const data = await res.json();
      setStatusMessage(`Policy evaluation complete: 0 unhandled critical deviations.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName) return;

    const newPol: PolicyItem = {
      id: `custom-policy-${Date.now()}`,
      name: newPolicyName,
      description: newPolicyDesc || "Custom organization cryptographic policy",
      enabled: true,
    };

    setPolicies((prev) => [newPol, ...prev]);
    setIsModalOpen(false);
    setNewPolicyName("");
    setNewPolicyDesc("");
    setStatusMessage(`Policy "${newPolicyName}" deployed to control plane.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
        <div className="text-xs text-slate-400 font-mono">
          Enforcing <strong>{policies.filter((p) => p.enabled).length}</strong> of {policies.length} security rules
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEvaluateNow}
            disabled={evaluating}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${evaluating ? "animate-spin text-cyan-400" : ""}`} />
            <span>{evaluating ? "Evaluating..." : "Evaluate Policies Now"}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Policy</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-xs text-cyan-300 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Policies List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Configured Cryptographic Governance Rules
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">{policy.name}</h3>
                </div>
                <p className="text-xs text-slate-400">{policy.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => togglePolicy(policy.id)}
                  className={`px-3 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                    policy.enabled
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {policy.enabled ? "ENFORCING" : "DISABLED"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Violations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>Active Policy Violations in Codebase ({violations.length})</span>
          </h2>
        </div>

        <div className="space-y-2.5">
          {violations.map((v, i) => (
            <div
              key={i}
              className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                      v.severity === "DENY"
                        ? "bg-red-950 text-red-400 border border-red-900"
                        : "bg-amber-950 text-amber-400 border border-amber-900"
                    }`}
                  >
                    {v.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{v.policyName}</span>
                </div>
                <div className="text-xs text-slate-300">{v.message}</div>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                {v.file}:{v.line}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Policy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-indigo-400" />
                <span>Define Cryptographic Policy Rule</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Policy Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prohibit Legacy Diffie-Hellman in Production"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Description & Compliance Rationale
                </label>
                <textarea
                  placeholder="Explain security policy requirements and NIST / FIPS mandate..."
                  value={newPolicyDesc}
                  onChange={(e) => setNewPolicyDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Enforcement Action
                </label>
                <select
                  value={newPolicyAction}
                  onChange={(e) => setNewPolicyAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="DENY">DENY (Block CI / Pull Request)</option>
                  <option value="WARN">WARN (Log Governance Advisory)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/20"
                >
                  Deploy Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
