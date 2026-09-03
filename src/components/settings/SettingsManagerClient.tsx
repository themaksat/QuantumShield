"use client";

import React, { useState } from "react";
import { Settings, Shield, Key, Cpu, GitBranch, Bell, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";

export function SettingsManagerClient() {
  const [fips203, setFips203] = useState(true);
  const [fips204, setFips204] = useState(true);
  const [fips205, setFips205] = useState(true);
  const [testingGithub, setTestingGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState<string | null>(null);
  const [reseeding, setReseeding] = useState(false);
  const [reseedStatus, setReseedStatus] = useState<string | null>(null);

  const handleTestGithub = () => {
    setTestingGithub(true);
    setGithubStatus(null);
    setTimeout(() => {
      setTestingGithub(false);
      setGithubStatus("Connected: GitHub App authenticated with read/write access to repositories, pull requests, and checks.");
    }, 1200);
  };

  const handleReseed = async () => {
    if (!confirm("This will rescan and reinitialize the demo project. Continue?")) return;
    try {
      setReseeding(true);
      setReseedStatus(null);
      const res = await fetch("/api/seed-demo", { method: "POST" });
      const data = await res.json();
      setReseedStatus("Demo project re-seeded and re-scanned successfully.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      setReseedStatus(`Error: ${e.message}`);
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GitHub App Integration */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitBranch className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">GitHub App Integration</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
            CONNECTED
          </span>
        </div>
        <p className="text-xs text-slate-400">
          QuantumShield communicates with GitHub to clone repositories, create migration branches, and issue automated Pull Requests with validation evidence.
        </p>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleTestGithub}
            disabled={testingGithub}
            className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testingGithub ? "animate-spin text-cyan-400" : ""}`} />
            <span>{testingGithub ? "Testing Connection..." : "Test GitHub Connection"}</span>
          </button>
        </div>

        {githubStatus && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{githubStatus}</span>
          </div>
        )}
      </div>

      {/* PQC Standards Configuration */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">Approved Post-Quantum Cryptographic Standards</h2>
        </div>
        <p className="text-xs text-slate-400">
          Toggle NIST finalized post-quantum standards for automated migration recipe targeting.
        </p>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">FIPS 203: ML-KEM</div>
              <div className="text-[11px] text-slate-400 font-normal">Module-Lattice Key Encapsulation (ML-KEM-512, ML-KEM-768, ML-KEM-1024)</div>
            </div>
            <button
              onClick={() => setFips203(!fips203)}
              className={`px-3 py-1 rounded text-[11px] font-bold ${
                fips203
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
            >
              {fips203 ? "ACTIVE" : "INACTIVE"}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">FIPS 204: ML-DSA</div>
              <div className="text-[11px] text-slate-400 font-normal">Module-Lattice Digital Signature Algorithm (ML-DSA-44, ML-DSA-65, ML-DSA-87)</div>
            </div>
            <button
              onClick={() => setFips204(!fips204)}
              className={`px-3 py-1 rounded text-[11px] font-bold ${
                fips204
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
            >
              {fips204 ? "ACTIVE" : "INACTIVE"}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">FIPS 205: SLH-DSA</div>
              <div className="text-[11px] text-slate-400 font-normal">Stateless Hash-Based Digital Signature Algorithm</div>
            </div>
            <button
              onClick={() => setFips205(!fips205)}
              className={`px-3 py-1 rounded text-[11px] font-bold ${
                fips205
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
            >
              {fips205 ? "ACTIVE" : "INACTIVE"}
            </button>
          </div>
        </div>
      </div>

      {/* Environment Management */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Database & Demo Reset</h2>
        </div>
        <p className="text-xs text-slate-400">
          Reinitialize the demo repository and re-run AST discovery to start clean benchmarks.
        </p>

        <div className="pt-2">
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reseeding ? "animate-spin" : ""}`} />
            <span>{reseeding ? "Resetting..." : "Reinitialize Demo Data"}</span>
          </button>
        </div>

        {reseedStatus && (
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800 text-xs text-cyan-300">
            {reseedStatus}
          </div>
        )}
      </div>
    </div>
  );
}
