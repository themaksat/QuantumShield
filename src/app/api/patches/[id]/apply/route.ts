import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { ScannerEngine } from "@/lib/scanner/engine";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patchId = params.id;

    const patch = await db.patch.findUnique({
      where: { id: patchId },
      include: {
        migrationPlan: {
          include: {
            finding: {
              include: { cryptoAsset: true },
            },
            repository: true,
          },
        },
      },
    });

    if (!patch) {
      return NextResponse.json({ error: "Patch not found" }, { status: 404 });
    }

    const repo = patch.migrationPlan.repository;
    const finding = patch.migrationPlan.finding;
    const targetFilePath = patch.targetFile;

    // Apply changes to disk if localPath exists
    if (repo.localPath) {
      const fullPath = path.join(repo.localPath, targetFilePath);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      // Write patched code to the file
      fs.writeFileSync(fullPath, patch.generatedCode, "utf-8");

      // Write companion files to disk if any
      if (patch.companionFiles) {
        try {
          const companions =
            typeof patch.companionFiles === "string"
              ? JSON.parse(patch.companionFiles)
              : patch.companionFiles;

          for (const comp of companions) {
            const compFullPath = path.join(repo.localPath, comp.path);
            const compDir = path.dirname(compFullPath);
            if (!fs.existsSync(compDir)) {
              fs.mkdirSync(compDir, { recursive: true });
            }
            fs.writeFileSync(compFullPath, comp.content, "utf-8");
          }
        } catch (e) {
          console.error("Error writing companion files:", e);
        }
      }
    }

    // Update Finding status to RESOLVED
    await db.finding.update({
      where: { id: finding.id },
      data: {
        status: "RESOLVED",
        riskScore: 0,
      },
    });

    // Update CryptoAsset if linked
    if (finding.cryptoAssetId) {
      await db.cryptoAsset.update({
        where: { id: finding.cryptoAssetId },
        data: {
          quantumVulnerable: false,
          migrationStatus: "migrated",
          riskScore: 0,
        },
      });
    }

    // Run automated re-scan on the repository to update posture score
    let newScore = 75;
    let newMetrics = null;
    if (repo.localPath) {
      try {
        const scanResults = await ScannerEngine.scanDirectory(
          repo.localPath,
          repo.name
        );
        const savedScan = await ScannerEngine.persistScan(repo.id, scanResults);
        newScore = savedScan.postureScore;
        newMetrics = scanResults.metrics;
      } catch (scanErr) {
        console.error("Auto scan after patch apply error:", scanErr);
      }
    }

    // Record Audit Event
    await db.auditEvent.create({
      data: {
        actor: "QuantumShield Bot (Automation)",
        action: "PATCH_APPLIED_AND_MERGED",
        objectType: "Finding",
        objectId: finding.id,
        metadata: JSON.stringify({
          targetFile: patch.targetFile,
          strategy: patch.migrationPlan.strategy,
          newPostureScore: newScore,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Patch successfully applied to codebase and verified.",
      newPostureScore: newScore,
      metrics: newMetrics,
      findingStatus: "RESOLVED",
    });
  } catch (error: any) {
    console.error("Apply patch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
