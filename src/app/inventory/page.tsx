import React from "react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { CBOMTableClient } from "@/components/inventory/CBOMTableClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: { repoId?: string };
}) {
  const { project, demoRepo } = await ensureDefaultProject();

  const repo =
    (await db.repository.findFirst({
      where: searchParams?.repoId
        ? { id: searchParams.repoId }
        : { id: demoRepo.id },
      include: {
        scans: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    })) ||
    (await db.repository.findFirst({
      include: {
        scans: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }));

  const latestScan = repo?.scans[0];

  const assets = await db.cryptoAsset.findMany({
    where: latestScan ? { scanId: latestScan.id } : {},
    include: { finding: true },
    orderBy: { riskScore: "desc" },
  });

  const formattedComponents = assets.map((a) => ({
    id: a.id,
    file: a.file,
    lineStart: a.lineStart,
    lineEnd: a.lineEnd,
    language: a.language,
    assetType: a.assetType,
    algorithm: a.algorithm,
    keySize: a.keySize,
    mode: a.mode,
    library: a.library,
    purpose: a.purpose,
    quantumVulnerable: a.quantumVulnerable,
    riskScore: a.riskScore,
    confidence: a.confidence,
    migrationStatus: a.migrationStatus,
    recommendedStrategy: a.recommendedStrategy,
    findingId: a.finding?.id || null,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cryptographic Bill of Materials (CBOM)
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/50">
            CycloneDX 1.6 Spec
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Standardized machine-readable inventory of all cryptographic algorithms, keys, protocols, and libraries.
        </p>
      </div>

      {/* Meta Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400 font-medium">BOM Serial Number</div>
          <div className="text-xs font-mono text-cyan-400 font-bold mt-1 truncate">
            urn:uuid:{latestScan?.id || "qs-initial"}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400 font-medium">Total Indexed Assets</div>
          <div className="text-lg font-bold font-mono text-white mt-1">{assets.length} components</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400 font-medium">Quantum Vulnerability Rate</div>
          <div className="text-lg font-bold font-mono text-red-400 mt-1">
            {assets.length > 0
              ? `${Math.round((assets.filter((a) => a.quantumVulnerable).length / assets.length) * 100)}%`
              : "0%"}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400 font-medium">Compliance Standard</div>
          <div className="text-xs font-mono text-emerald-400 font-bold mt-1">
            FIPS 203 / 204 / 205 Standard
          </div>
        </div>
      </div>

      {/* Client Table with live search, filters, sorting, diff modal, and exports */}
      <CBOMTableClient
        projectId={project.id}
        repoName={repo?.name || "enterprise-payments-core"}
        scanId={latestScan?.id || ""}
        components={formattedComponents}
      />
    </div>
  );
}
