import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { MigrationEngine } from "@/lib/migration/recipes";
import { CryptoFindingRaw } from "@/lib/scanner/types";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await db.migrationPlan.findUnique({
      where: { id: params.id },
      include: {
        finding: {
          include: { cryptoAsset: true },
        },
        repository: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Migration plan not found" }, { status: 404 });
    }

    const finding = plan.finding;
    const repo = plan.repository;

    // Detect language from file
    let detectedLang = finding.cryptoAsset?.language || "typescript";
    if (finding.file.endsWith(".go")) detectedLang = "golang";
    else if (finding.file.endsWith(".java")) detectedLang = "java";
    else if (finding.file.endsWith(".py")) detectedLang = "python";
    else if (finding.file.endsWith(".js") || finding.file.endsWith(".jsx")) detectedLang = "javascript";

    // Read original file content
    let originalContent = finding.codeSnippet;
    let fullFilePath = "";
    if (repo.localPath) {
      fullFilePath = path.join(repo.localPath, finding.file);
      if (fs.existsSync(fullFilePath)) {
        originalContent = fs.readFileSync(fullFilePath, "utf-8");
      }
    }

    const rawFinding: CryptoFindingRaw = {
      id: finding.id,
      file: finding.file,
      lineStart: finding.lineStart,
      lineEnd: finding.lineEnd,
      language: detectedLang,
      assetType: (finding.cryptoAsset?.assetType as any) || "digital_signature",
      algorithm: finding.algorithm,
      keySize: finding.keyLength || undefined,
      library: finding.library,
      purpose: finding.purpose,
      quantumVulnerable: finding.cryptoAsset?.quantumVulnerable ?? true,
      confidence: finding.confidence,
      codeSnippet: finding.codeSnippet,
      evidence: finding.evidence || "",
      title: finding.title,
      severity: finding.severity as any,
      migrationComplexity: finding.migrationComplexity as any,
      recommendedStrategy: finding.recommendedStrategy,
      migrationCandidates: [],
      affectedDependencies: finding.affectedDependencies ? JSON.parse(finding.affectedDependencies) : [],
    };

    const env = {
      language: detectedLang,
      installedDependencies: {},
      hasNativePqcProvider: false,
    };

    const recipe = MigrationEngine.findRecipe(rawFinding, env);
    const patchOutput = await recipe.generatePatch(rawFinding, originalContent);

    // Save Patch to database
    const savedPatch = await db.patch.create({
      data: {
        migrationPlanId: plan.id,
        findingId: finding.id,
        repositoryId: repo.id,
        targetFile: finding.file,
        originalCode: patchOutput.originalCode,
        generatedCode: patchOutput.generatedCode,
        diff: patchOutput.diff,
        companionFiles: JSON.stringify(patchOutput.companionFiles),
        rationale: patchOutput.rationale,
        rollbackNotes: patchOutput.rollbackNotes,
        securityAssumptions: patchOutput.securityAssumptions,
        confidence: patchOutput.confidence,
        status: "DRAFT",
      },
    });

    // Update Finding status to PATCH_READY
    await db.finding.update({
      where: { id: finding.id },
      data: { status: "PATCH_READY" },
    });

    // Log Audit Event
    await db.auditEvent.create({
      data: {
        actor: "patch-generator",
        action: "PATCH_GENERATED",
        objectType: "Patch",
        objectId: savedPatch.id,
        metadata: JSON.stringify({
          targetFile: finding.file,
          diffSizeLines: patchOutput.diff.split("\n").length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      patch: {
        ...savedPatch,
        companionFiles: patchOutput.companionFiles,
      },
    });
  } catch (error: any) {
    console.error("Generate patch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
