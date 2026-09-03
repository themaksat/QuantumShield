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
          take: 2,
        },
      },
    });

    if (!repo || repo.scans.length < 2) {
      return NextResponse.json({
        hasDiff: false,
        message: "Need at least two scans to compute CBOM diff",
        added: [],
        removed: [],
        modified: [],
      });
    }

    const currentScan = repo.scans[0];
    const previousScan = repo.scans[1];

    const currentAssets = await db.cryptoAsset.findMany({ where: { scanId: currentScan.id } });
    const previousAssets = await db.cryptoAsset.findMany({ where: { scanId: previousScan.id } });

    const prevMap = new Map(previousAssets.map((a) => [`${a.file}:${a.algorithm}`, a]));
    const currMap = new Map(currentAssets.map((a) => [`${a.file}:${a.algorithm}`, a]));

    const added = currentAssets.filter((a) => !prevMap.has(`${a.file}:${a.algorithm}`));
    const removed = previousAssets.filter((a) => !currMap.has(`${a.file}:${a.algorithm}`));

    return NextResponse.json({
      hasDiff: true,
      currentScanId: currentScan.id,
      previousScanId: previousScan.id,
      added,
      removed,
      postureDelta: currentScan.postureScore - previousScan.postureScore,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
