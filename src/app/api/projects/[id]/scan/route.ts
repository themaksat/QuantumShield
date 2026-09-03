import { NextResponse } from "next/server";
import path from "path";
import { db } from "@/lib/db";
import { ScannerEngine } from "@/lib/scanner/engine";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await req.json().catch(() => ({}));

    // Find repository in this project
    let repository = await db.repository.findFirst({
      where: {
        OR: [{ id: body.repositoryId || "" }, { projectId }],
      },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "No repository found for this project" },
        { status: 404 }
      );
    }

    // Determine target local directory to scan
    let scanPath = repository.localPath;
    if (!scanPath) {
      scanPath = path.resolve(process.cwd(), "demo-vulnerable-repo");
    }

    // Run Static Analysis Scanner Engine
    const scanResults = await ScannerEngine.scanDirectory(
      scanPath,
      repository.name
    );

    // Persist to database
    const savedScan = await ScannerEngine.persistScan(
      repository.id,
      scanResults
    );

    return NextResponse.json({
      success: true,
      scanId: savedScan.id,
      metrics: scanResults.metrics,
      totalFindings: scanResults.findings.length,
      postureScore: savedScan.postureScore,
    });
  } catch (error: any) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
