import React from "react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { RepositoryManager } from "@/components/repositories/RepositoryManager";

export const dynamic = "force-dynamic";

export default async function RepositoriesPage() {
  const { project } = await ensureDefaultProject();

  const freshProject = await db.project.findFirst({
    where: { id: project.id },
    include: {
      repositories: {
        include: {
          scans: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { cryptoAssets: true, findings: true } },
        },
      },
    },
  });

  const repos = (freshProject?.repositories || []).map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    defaultBranch: r.defaultBranch,
    localPath: r.localPath,
    scans: r.scans.map((s) => ({
      id: s.id,
      totalAssets: s.totalAssets,
      vulnerableCount: s.vulnerableCount,
      postureScore: s.postureScore,
      createdAt: s.createdAt.toISOString(),
    })),
    _count: r._count,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Connected Repositories</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ingest local source code, connect GitHub App repositories, and configure continuous monitoring.
        </p>
      </div>

      <RepositoryManager
        projectId={project.id}
        initialRepositories={repos}
      />
    </div>
  );
}
