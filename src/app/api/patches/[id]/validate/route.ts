import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ValidationRunner } from "@/lib/validator/runner";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patch = await db.patch.findUnique({
      where: { id: params.id },
      include: { finding: true },
    });

    if (!patch) {
      return NextResponse.json({ error: "Patch not found" }, { status: 404 });
    }

    const companions = patch.companionFiles ? JSON.parse(patch.companionFiles) : [];

    // Run Multi-Stage Validation
    const validationReport = await ValidationRunner.validatePatch({
      targetFile: patch.targetFile,
      originalCode: patch.originalCode,
      generatedCode: patch.generatedCode,
      companionFiles: companions,
    });

    // Save ValidationRun
    const validationRun = await db.validationRun.create({
      data: {
        patchId: patch.id,
        findingId: patch.findingId,
        status: validationReport.overallStatus,
        syntaxCheck: validationReport.syntaxCheck,
        buildCheck: validationReport.buildCheck,
        testCheck: validationReport.testCheck,
        secretScanCheck: validationReport.secretScanCheck,
        cryptoPolicyCheck: validationReport.cryptoPolicyCheck,
        compatibilityCheck: validationReport.compatibilityCheck,
        latencyImpact: validationReport.latencyImpact,
        payloadSizeDelta: validationReport.payloadSizeDelta,
        details: JSON.stringify(validationReport.checks),
      },
    });

    // Save BenchmarkRun
    await db.benchmarkRun.create({
      data: {
        patchId: patch.id,
        findingId: patch.findingId,
        baselineHandshakeBytes: validationReport.benchmark.baselineHandshakeBytes,
        candidateHandshakeBytes: validationReport.benchmark.candidateHandshakeBytes,
        baselineCpuMs: validationReport.benchmark.baselineCpuMs,
        candidateCpuMs: validationReport.benchmark.candidateCpuMs,
        baselineLatencyMs: validationReport.benchmark.baselineLatencyMs,
        candidateLatencyMs: validationReport.benchmark.candidateLatencyMs,
        memoryDeltaBytes: validationReport.benchmark.memoryDeltaBytes,
      },
    });

    // Update Patch and Finding status
    await db.patch.update({
      where: { id: patch.id },
      data: { status: "VALIDATED" },
    });

    await db.finding.update({
      where: { id: patch.findingId },
      data: { status: "REVIEW_REQUIRED" },
    });

    // Audit Event
    await db.auditEvent.create({
      data: {
        actor: "validator-engine",
        action: "VALIDATION_EXECUTED",
        objectType: "ValidationRun",
        objectId: validationRun.id,
        metadata: JSON.stringify({
          overallStatus: validationReport.overallStatus,
          latencyImpact: validationReport.latencyImpact,
          payloadDelta: validationReport.payloadSizeDelta,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      validation: validationReport,
      runId: validationRun.id,
    });
  } catch (error: any) {
    console.error("Validation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
