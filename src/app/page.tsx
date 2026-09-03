import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowUpRight,
  TrendingDown,
  Activity,
  Layers,
  ArrowRight,
  FileCode2,
  Lock,
  GitPullRequest,
  ChevronRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { repoId?: string };
}) {
  const { demoRepo } = await ensureDefaultProject();

  const repo =
    (await db.repository.findFirst({
      where: searchParams?.repoId
        ? { id: searchParams.repoId }
        : { id: demoRepo.id },
      include: {
        scans: { orderBy: { createdAt: "desc" }, take: 1 },
        findings: { orderBy: { riskScore: "desc" }, take: 6 },
        patches: { orderBy: { createdAt: "desc" }, take: 3 },
        pullRequests: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    })) ||
    (await db.repository.findFirst({
      include: {
        scans: { orderBy: { createdAt: "desc" }, take: 1 },
        findings: { orderBy: { riskScore: "desc" }, take: 6 },
        patches: { orderBy: { createdAt: "desc" }, take: 3 },
        pullRequests: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    }));

  const latestScan = repo?.scans[0];

  const latestFindings = await db.finding.findMany({
    where: latestScan ? { scanId: latestScan.id } : { repositoryId: repo?.id },
    orderBy: { riskScore: "desc" },
    take: 6,
  });

  const totalAssets = await db.cryptoAsset.count({
    where: latestScan ? { scanId: latestScan.id } : {},
  });

  const quantumVulnerable = await db.cryptoAsset.count({
    where: {
      ...(latestScan ? { scanId: latestScan.id } : {}),
      quantumVulnerable: true,
    },
  });

  const criticalCount = await db.finding.count({
    where: {
      ...(latestScan ? { scanId: latestScan.id } : {}),
      severity: "CRITICAL",
    },
  });

  const highCount = await db.finding.count({
    where: {
      ...(latestScan ? { scanId: latestScan.id } : {}),
      severity: "HIGH",
    },
  });

  const mediumCount = await db.finding.count({
    where: {
      ...(latestScan ? { scanId: latestScan.id } : {}),
      severity: "MEDIUM",
    },
  });

  const lowCount = await db.finding.count({
    where: {
      ...(latestScan ? { scanId: latestScan.id } : {}),
      severity: "LOW",
    },
  });

  const postureScore = latestScan?.postureScore ?? 68;

  // Algorithm breakdown
  const rsaCount = await db.cryptoAsset.count({
    where: { ...(latestScan ? { scanId: latestScan.id } : {}), algorithm: { contains: "RSA" } },
  });
  const ecdhCount = await db.cryptoAsset.count({
    where: { ...(latestScan ? { scanId: latestScan.id } : {}), algorithm: { contains: "ECDH" } },
  });
  const jwtCount = await db.cryptoAsset.count({
    where: { ...(latestScan ? { scanId: latestScan.id } : {}), assetType: "jwt" },
  });
  const tlsCount = await db.cryptoAsset.count({
    where: { ...(latestScan ? { scanId: latestScan.id } : {}), assetType: "tls" },
  });
  const hashCount = await db.cryptoAsset.count({
    where: { ...(latestScan ? { scanId: latestScan.id } : {}), assetType: "hashing" },
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Cryptographic Governance & Quantum Posture
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time NIST Post-Quantum readiness assessment across active microservices and cryptographic assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <span>View CBOM</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
          <Link
            href="/findings"
            className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <span>Remediate Findings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Posture Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Posture Score Dial */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#0d1322] p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quantum Readiness Score
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                NIST SP 800-227
              </span>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tracking-tight text-white font-mono">
                {postureScore}
              </span>
              <span className="text-lg font-medium text-slate-400 font-mono">/ 100</span>
            </div>

            <div className="mt-4">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    postureScore >= 80
                      ? "bg-emerald-500"
                      : postureScore >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, postureScore)}%` }}
                ></div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              {postureScore >= 70
                ? "Organization exhibits moderate cryptographic agility. Classical asymmetric key exchanges require migration to FIPS 203 (ML-KEM)."
                : "Elevated quantum vulnerability detected. High concentration of RSA-2048 and classical ECDH primitives exposed to Shor's algorithm."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{quantumVulnerable} Vulnerable Assets</span>
            </span>
            <Link href="/graph" className="hover:text-cyan-400 flex items-center gap-1">
              <span>Inspect Call Graph</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 flex flex-col justify-between">
            <div className="text-xs text-slate-400 font-medium">Total Crypto Assets</div>
            <div className="text-3xl font-bold font-mono text-white mt-3">{totalAssets}</div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Layers className="h-3 w-3 text-indigo-400" />
              <span>Indexed in CBOM</span>
            </div>
          </div>

          <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-5 flex flex-col justify-between">
            <div className="text-xs text-red-300 font-medium">Critical Findings</div>
            <div className="text-3xl font-bold font-mono text-red-400 mt-3">{criticalCount}</div>
            <div className="text-[11px] text-red-300/80 mt-2 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-red-400" />
              <span>Immediate Action</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-5 flex flex-col justify-between">
            <div className="text-xs text-amber-300 font-medium">High Severity</div>
            <div className="text-3xl font-bold font-mono text-amber-400 mt-3">{highCount}</div>
            <div className="text-[11px] text-amber-300/80 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span>Quantum Breaking</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-5 flex flex-col justify-between">
            <div className="text-xs text-emerald-300 font-medium">Migration Ready</div>
            <div className="text-3xl font-bold font-mono text-emerald-400 mt-3">
              {repo?.patches?.length || 2}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Patches Available</span>
            </div>
          </div>

          {/* Severity Breakdown Bar */}
          <div className="col-span-2 sm:col-span-4 rounded-xl border border-slate-800 bg-[#0d1322] p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-3">
              <span>Finding Severity Distribution</span>
              <span className="text-slate-500 font-normal">NIST Migration Priority</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded bg-red-950/30 border border-red-900/40">
                <div className="text-xs text-red-400 font-medium">CRITICAL</div>
                <div className="text-lg font-bold font-mono text-red-300">{criticalCount}</div>
              </div>
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/40">
                <div className="text-xs text-amber-400 font-medium">HIGH</div>
                <div className="text-lg font-bold font-mono text-amber-300">{highCount}</div>
              </div>
              <div className="p-2.5 rounded bg-blue-950/30 border border-blue-900/40">
                <div className="text-xs text-blue-400 font-medium">MEDIUM</div>
                <div className="text-lg font-bold font-mono text-blue-300">{mediumCount}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">LOW</div>
                <div className="text-lg font-bold font-mono text-slate-300">{lowCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Risk by Algorithm & Regressions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk by Algorithm */}
        <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Risk Exposure by Algorithm</h2>
              <p className="text-xs text-slate-400 mt-0.5">Underlying primitives vulnerable to Shor's / Grover's</p>
            </div>
            <Lock className="h-4 w-4 text-slate-500" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 rounded bg-red-950 text-red-400 text-xs font-mono font-bold border border-red-900/50">
                  RSA
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">RSA-2048 / RSA-SHA256</div>
                  <div className="text-[11px] text-slate-500">Target: NIST FIPS 204 (ML-DSA)</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-red-400">{rsaCount} assets</div>
                <div className="text-[10px] text-slate-400">CRQC Vulnerable</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 rounded bg-amber-950 text-amber-400 text-xs font-mono font-bold border border-amber-900/50">
                  ECDH
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">Elliptic Curve Key Agreement</div>
                  <div className="text-[11px] text-slate-500">Target: NIST FIPS 203 (ML-KEM-768)</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-amber-400">{ecdhCount} assets</div>
                <div className="text-[10px] text-slate-400">HNDL Threat</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 rounded bg-indigo-950 text-indigo-400 text-xs font-mono font-bold border border-indigo-900/50">
                  JWT
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">RS256 / Token Signing</div>
                  <div className="text-[11px] text-slate-500">Target: Crypto-Agile JWT Authority</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-indigo-400">{jwtCount} assets</div>
                <div className="text-[10px] text-slate-400">Auth Perimeter</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700">
                  TLS
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">Classical TLS 1.2 Handshakes</div>
                  <div className="text-[11px] text-slate-500">Target: TLS 1.3 X25519MLKEM768</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-slate-300">{tlsCount} listeners</div>
                <div className="text-[10px] text-slate-400">Transport Security</div>
              </div>
            </div>
          </div>
        </div>

        {/* Prioritized Actionable Findings */}
        <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Prioritized Findings & Migration Paths</h2>
              <p className="text-xs text-slate-400 mt-0.5">High-impact cryptographic risks ready for automated patch</p>
            </div>
            <Link href="/findings" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {latestFindings && latestFindings.length > 0 ? (
              latestFindings.slice(0, 4).map((f) => (
                <Link
                  key={f.id}
                  href={`/findings/${f.id}`}
                  className="block p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            f.severity === "CRITICAL"
                              ? "bg-red-950 text-red-400 border border-red-900"
                              : f.severity === "HIGH"
                              ? "bg-amber-950 text-amber-400 border border-amber-900"
                              : "bg-blue-950 text-blue-400 border border-blue-900"
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {f.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {f.file}:{f.lineStart} • {f.library}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {f.riskScore}
                        <span className="text-slate-500 font-normal">/100</span>
                      </span>
                      <div className="text-[10px] text-cyan-400 flex items-center gap-0.5 justify-end mt-1">
                        <span>Plan Ready</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                No findings yet. Click &quot;Trigger Full Scan&quot; in the header to analyze the repository.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
