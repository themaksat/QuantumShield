import { NextResponse } from "next/server";
import path from "path";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { ScannerEngine } from "@/lib/scanner/engine";

export async function POST() {
  try {
    const { org, project, demoRepo } = await ensureDefaultProject();

    // Check if scans already exist
    const scanCount = await db.scan.count({
      where: { repositoryId: demoRepo.id },
    });

    let scanId = null;
    if (scanCount === 0) {
      const demoPath = path.resolve(process.cwd(), "demo-vulnerable-repo");
      const scanResults = await ScannerEngine.scanDirectory(
        demoPath,
        demoRepo.name
      );
      const savedScan = await ScannerEngine.persistScan(
        demoRepo.id,
        scanResults
      );
      scanId = savedScan.id;
    } else {
      const latest = await db.scan.findFirst({
        where: { repositoryId: demoRepo.id },
        orderBy: { createdAt: "desc" },
      });
      scanId = latest?.id;
    }

    return NextResponse.json({
      success: true,
      orgId: org.id,
      projectId: project.id,
      repoId: demoRepo.id,
      scanId,
    });
  } catch (error: any) {
    console.error("Seed demo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
