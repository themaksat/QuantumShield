import React from "react";
import { GitFork, Layers, Info } from "lucide-react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { DependencyGraphViewer } from "@/components/graph/DependencyGraphViewer";

export const dynamic = "force-dynamic";

export default async function GraphPage({
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
      },
    })) ||
    (await db.repository.findFirst({
      include: {
        scans: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }));

  const latestScan = repo?.scans[0];

  const dbNodes = await db.dependencyNode.findMany({
    where: latestScan ? { scanId: latestScan.id } : {},
  });

  const dbEdges = await db.dependencyEdge.findMany({
    where: latestScan ? { scanId: latestScan.id } : {},
  });

  const nodes = dbNodes.map((n) => ({
    id: n.nodeId,
    label: n.label,
    type: n.nodeType,
    metadata: n.metadata ? JSON.parse(n.metadata) : {},
  }));

  const edges = dbEdges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    relation: e.relation,
    confidence: e.confidence,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Cryptographic Dependency Graph
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/50">
              AST Inferred
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Structural relationship mapping: Service → Source File → Crypto Library → Algorithm & Key.
          </p>
        </div>
      </div>

      <DependencyGraphViewer nodes={nodes} edges={edges} />
    </div>
  );
}
