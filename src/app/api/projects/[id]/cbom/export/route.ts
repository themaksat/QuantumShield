import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const projectId = params.id;

    const repositoryId = searchParams.get("repositoryId");

    // Find repository with scans
    const repo = await db.repository.findFirst({
      where: repositoryId
        ? { id: repositoryId }
        : { projectId, scans: { some: {} } },
      include: {
        scans: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!repo || repo.scans.length === 0) {
      return new Response("No scan data found", { status: 404 });
    }

    const latestScan = repo.scans[0];
    const assets = await db.cryptoAsset.findMany({
      where: { scanId: latestScan.id },
      orderBy: { riskScore: "desc" },
    });

    if (format === "csv") {
      const headers = [
        "Component ID",
        "Algorithm",
        "Key Size",
        "Mode",
        "Library",
        "Purpose",
        "File",
        "Line Start",
        "Line End",
        "Language",
        "Asset Type",
        "Quantum Vulnerable",
        "Risk Score",
        "Confidence",
        "Migration Status",
      ];

      const csvRows = [headers.join(",")];
      for (const a of assets) {
        const row = [
          `"${a.id}"`,
          `"${a.algorithm}"`,
          a.keySize || "",
          `"${a.mode || ""}"`,
          `"${a.library}"`,
          `"${(a.purpose || "").replace(/"/g, '""')}"`,
          `"${a.file}"`,
          a.lineStart,
          a.lineEnd,
          `"${a.language}"`,
          `"${a.assetType}"`,
          a.quantumVulnerable ? "TRUE" : "FALSE",
          a.riskScore,
          a.confidence,
          `"${a.migrationStatus}"`,
        ];
        csvRows.push(row.join(","));
      }

      return new Response(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="quantumshield-cbom-${repo.name}.csv"`,
        },
      });
    }

    // Default JSON: CycloneDX 1.6
    const report = {
      bomFormat: "CycloneDX",
      specVersion: "1.6",
      serialNumber: `urn:uuid:${latestScan.id}`,
      version: 1,
      metadata: {
        timestamp: latestScan.createdAt.toISOString(),
        repository: repo.name,
        totalAssets: assets.length,
      },
      components: assets,
    };

    return new Response(JSON.stringify(report, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="quantumshield-cbom-${repo.name}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
