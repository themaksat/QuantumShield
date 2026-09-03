import React from "react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { FindingsListClient } from "@/components/findings/FindingsListClient";

export const dynamic = "force-dynamic";

export default async function FindingsPage({
  searchParams,
}: {
  searchParams?: { repoId?: string };
}) {
  const { demoRepo } = await ensureDefaultProject();

  const targetRepoId = searchParams?.repoId || demoRepo.id;

  const latestScan = await db.scan.findFirst({
    where: { repositoryId: targetRepoId },
    orderBy: { createdAt: "desc" },
  });

  const findings = await db.finding.findMany({
    where: latestScan ? { scanId: latestScan.id } : { repositoryId: targetRepoId },
    include: {
      migrationPlans: true,
      patches: {
        include: { pullRequests: true },
      },
    },
    orderBy: { riskScore: "desc" },
  });

  const formattedFindings = findings.map((f) => ({
    id: f.id,
    title: f.title,
    severity: f.severity,
    status: f.status,
    algorithm: f.algorithm,
    keyLength: f.keyLength,
    library: f.library,
    file: f.file,
    lineStart: f.lineStart,
    lineEnd: f.lineEnd,
    riskScore: f.riskScore,
    confidence: f.confidence,
    migrationComplexity: f.migrationComplexity,
    recommendedStrategy: f.recommendedStrategy,
    hasPlan: f.migrationPlans.length > 0,
    hasPatch: f.patches.length > 0,
    hasPr: f.patches.some((p) => p.pullRequests.length > 0),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Cryptographic Vulnerabilities & Findings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Prioritized quantum-vulnerable cryptographic implementations, weak key sizes, and legacy algorithms.
        </p>
      </div>

      <FindingsListClient findings={formattedFindings} />
    </div>
  );
}
