import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MigrationEngine } from "@/lib/migration/recipes";
import { CryptoFindingRaw } from "@/lib/scanner/types";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const finding = await db.finding.findUnique({
      where: { id: params.id },
      include: { repository: true, cryptoAsset: true },
    });

    if (!finding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    let detectedLang = finding.cryptoAsset?.language || "typescript";
    if (finding.file.endsWith(".go")) detectedLang = "golang";
    else if (finding.file.endsWith(".java")) detectedLang = "java";
    else if (finding.file.endsWith(".py")) detectedLang = "python";
    else if (finding.file.endsWith(".js") || finding.file.endsWith(".jsx")) detectedLang = "javascript";

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
      language: rawFinding.language,
      installedDependencies: {},
      hasNativePqcProvider: false,
    };

    const recipe = MigrationEngine.findRecipe(rawFinding, env);
    const plan = await recipe.plan(rawFinding, env);

    // Persist MigrationPlan
    const savedPlan = await db.migrationPlan.create({
      data: {
        findingId: finding.id,
        repositoryId: finding.repositoryId,
        strategy: plan.strategy,
        currentAlgorithm: plan.currentAlgorithm,
        targetAlgorithm: plan.targetAlgorithm,
        readiness: plan.readiness,
        readinessReason: plan.readinessReason,
        steps: JSON.stringify(plan.steps),
        risks: JSON.stringify(plan.risks),
        prerequisites: JSON.stringify(plan.prerequisites),
      },
    });

    // Update Finding status to PLAN_READY
    await db.finding.update({
      where: { id: finding.id },
      data: { status: "PLAN_READY" },
    });

    // Log Audit Event
    await db.auditEvent.create({
      data: {
        actor: "migration-engine",
        action: "MIGRATION_GENERATED",
        objectType: "MigrationPlan",
        objectId: savedPlan.id,
        metadata: JSON.stringify({
          strategy: plan.strategy,
          targetAlgorithm: plan.targetAlgorithm,
          readiness: plan.readiness,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      plan: {
        ...savedPlan,
        steps: plan.steps,
        risks: plan.risks,
        prerequisites: plan.prerequisites,
        securityAssumptions: plan.securityAssumptions,
        rollbackInstructions: plan.rollbackInstructions,
      },
    });
  } catch (error: any) {
    console.error("Migration plan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
