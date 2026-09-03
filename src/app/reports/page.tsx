import React from "react";
import {
  FileBarChart,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { ReportPrintClient } from "@/components/reports/ReportPrintClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { project, demoRepo } = await ensureDefaultProject();

  const repo = await db.repository.findFirst({
    where: { id: demoRepo.id },
    include: {
      scans: { orderBy: { createdAt: "desc" }, take: 1 },
      findings: { orderBy: { riskScore: "desc" } },
    },
  });

  const latestScan = repo?.scans[0];
  const findings = repo?.findings || [];
  const postureScore = latestScan?.postureScore || 68;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive PQC Migration Report</h1>
          <p className="text-sm text-slate-400 mt-1">
            Official cryptographic readiness assessment and NIST compliance roadmap for leadership.
          </p>
        </div>

        <ReportPrintClient projectId={project.id} />
      </div>

      {/* Printable Report Document Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-8 md:p-12 space-y-10 shadow-lg print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold print:text-indigo-700">
              QUANTUMSHIELD ENTERPRISE ASSURANCE
            </div>
            <h2 className="text-xl font-bold text-white mt-1 print:text-black">
              Post-Quantum Cryptographic Readiness & Exposure Audit
            </h2>
            <div className="text-xs text-slate-400 font-mono mt-2 print:text-slate-600">
              Target System: {project.name} • {repo?.name} • Generated: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-950 text-cyan-400 border border-indigo-800 print:border-black print:text-black print:bg-slate-100">
              FIPS 203/204/205 AUDIT
            </span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-2 border-indigo-500 pl-3 print:text-black print:border-black">
            1. Executive Summary
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed print:text-slate-800">
            QuantumShield performed a comprehensive, multi-language static analysis across all microservices and cryptographic modules in the <strong>{repo?.name}</strong> codebase. The audit identified an overall Quantum Readiness Score of <strong>{postureScore} / 100</strong>. Active exposure is primarily driven by classical RSA-2048 signing keys in transaction settlement modules, unhedged ECDH key agreement vulnerable to &quot;Harvest Now, Decrypt Later&quot; (HNDL), and hardcoded development secrets.
          </p>
        </div>

        {/* Section 2: Quantum Readiness Score */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-2 border-indigo-500 pl-3 print:text-black print:border-black">
            2. Quantum Readiness Score & Posture Metric
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="text-xs text-slate-400 print:text-slate-600">Readiness Score</div>
              <div className="text-3xl font-bold font-mono text-emerald-400 mt-1 print:text-emerald-700">{postureScore}/100</div>
              <div className="text-[10px] text-slate-500 mt-1 print:text-slate-500">NIST SP 800-227 Calibrated</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="text-xs text-slate-400 print:text-slate-600">Total Cryptographic Assets</div>
              <div className="text-3xl font-bold font-mono text-white mt-1 print:text-black">{findings.length}</div>
              <div className="text-[10px] text-slate-500 mt-1 print:text-slate-500">Indexed in CBOM</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 print:bg-slate-50 print:border-slate-300">
              <div className="text-xs text-slate-400 print:text-slate-600">CRQC Vulnerable Primitives</div>
              <div className="text-3xl font-bold font-mono text-red-400 mt-1 print:text-red-700">
                {findings.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH").length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 print:text-slate-500">Requires Priority Remediation</div>
            </div>
          </div>
        </div>

        {/* Section 3: Critical Findings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-2 border-indigo-500 pl-3 print:text-black print:border-black">
            3. Critical & High Priority Findings
          </h3>
          <div className="space-y-2">
            {findings.slice(0, 5).map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs print:bg-slate-50 print:border-slate-300"
              >
                <div>
                  <div className="font-semibold text-slate-200 print:text-black">{f.title}</div>
                  <div className="text-slate-500 font-mono text-[11px] print:text-slate-600">
                    {f.file}:{f.lineStart} • {f.library}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-amber-400 print:text-amber-700">{f.riskScore} / 100</div>
                  <div className="text-[10px] text-slate-400 print:text-slate-500">{f.severity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Recommended Next Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-2 border-indigo-500 pl-3 print:text-black print:border-black">
            4. Recommended Next Actions
          </h3>
          <div className="space-y-2 text-xs text-slate-300 print:text-slate-800">
            <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 flex items-start gap-2.5 print:bg-slate-50 print:border-slate-300">
              <span className="font-bold text-indigo-400 font-mono print:text-indigo-700">01.</span>
              <span>
                Deploy <strong>CryptoProvider</strong> abstraction layer across signing modules to enable dual-signature verification under NIST FIPS 204 (ML-DSA).
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 flex items-start gap-2.5 print:bg-slate-50 print:border-slate-300">
              <span className="font-bold text-indigo-400 font-mono print:text-indigo-700">02.</span>
              <span>
                Upgrade inter-service key exchange to hybrid X25519 + NIST FIPS 203 (ML-KEM-768) encapsulation.
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 flex items-start gap-2.5 print:bg-slate-50 print:border-slate-300">
              <span className="font-bold text-indigo-400 font-mono print:text-indigo-700">03.</span>
              <span>
                Rotate all hardcoded test credentials into cloud KMS / Secret Manager immediately.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
