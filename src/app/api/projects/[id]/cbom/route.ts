import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Find repository
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
      return NextResponse.json({ cbom: null, components: [] });
    }

    const latestScan = repo.scans[0];

    const assets = await db.cryptoAsset.findMany({
      where: { scanId: latestScan.id },
      orderBy: { riskScore: "desc" },
    });

    const components = assets.map((a) => ({
      id: a.id,
      repository: repo.name,
      file: a.file,
      line_start: a.lineStart,
      line_end: a.lineEnd,
      language: a.language,
      asset_type: a.assetType,
      algorithm: a.algorithm,
      key_size: a.keySize,
      mode: a.mode,
      library: a.library,
      library_version: a.libraryVersion,
      purpose: a.purpose,
      protocol: a.protocol,
      quantum_vulnerable: a.quantumVulnerable,
      risk_score: a.riskScore,
      confidence: a.confidence,
      migration_status: a.migrationStatus,
      recommended_strategy: a.recommendedStrategy,
      dependencies: a.dependencies ? JSON.parse(a.dependencies) : [],
      metadata: a.metadata ? JSON.parse(a.metadata) : {},
    }));

    const cbomReport = {
      bomFormat: "CycloneDX-CBOM",
      specVersion: "1.6",
      serialNumber: `urn:uuid:${latestScan.id}`,
      version: 1,
      metadata: {
        timestamp: latestScan.createdAt.toISOString(),
        repository: repo.name,
        scannerVersion: "QuantumShield-StaticScanner-1.0.0",
        totalAssets: assets.length,
        quantumVulnerableAssets: assets.filter((a) => a.quantumVulnerable).length,
      },
      components,
    };

    return NextResponse.json(cbomReport);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
