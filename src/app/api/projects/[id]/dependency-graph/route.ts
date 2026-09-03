import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const repo = await db.repository.findFirst({
      where: { projectId },
      include: {
        scans: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!repo || repo.scans.length === 0) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    const latestScan = repo.scans[0];

    const nodes = await db.dependencyNode.findMany({
      where: { scanId: latestScan.id },
    });

    const edges = await db.dependencyEdge.findMany({
      where: { scanId: latestScan.id },
    });

    const formattedNodes = nodes.map((n) => ({
      id: n.nodeId,
      label: n.label,
      type: n.nodeType,
      metadata: n.metadata ? JSON.parse(n.metadata) : {},
    }));

    const formattedEdges = edges.map((e) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      relation: e.relation,
      confidence: e.confidence,
    }));

    return NextResponse.json({
      scanId: latestScan.id,
      repository: repo.name,
      nodes: formattedNodes,
      edges: formattedEdges,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
