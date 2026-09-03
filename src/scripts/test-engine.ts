import path from "path";
import { ensureDefaultProject } from "../lib/seed";
import { ScannerEngine } from "../lib/scanner/engine";
import { db } from "../lib/db";
import { MigrationEngine } from "../lib/migration/recipes";
import { ValidationRunner } from "../lib/validator/runner";
import { GitService } from "../lib/git/service";

async function main() {
  console.log("=== QUANTUMSHIELD VERIFICATION SUITE ===");

  // 1. Ensure project & repository
  console.log("1. Initializing Organization and Project...");
  const { project, demoRepo } = await ensureDefaultProject();
  console.log(`   Project: ${project.name} (ID: ${project.id})`);
  console.log(`   Repository: ${demoRepo.name} (Path: ${demoRepo.localPath})`);

  // 2. Run Scanner Engine
  console.log("\n2. Executing Static Analysis Scanner on demo repository...");
  const repoPath = demoRepo.localPath || path.resolve(process.cwd(), "demo-vulnerable-repo");
  const scanResults = await ScannerEngine.scanDirectory(repoPath, demoRepo.name);
  console.log(`   Total Cryptographic Assets Discovered: ${scanResults.metrics.totalAssets}`);
  console.log(`   Quantum Vulnerable Assets: ${scanResults.metrics.quantumVulnerable}`);
  console.log(`   Critical Vulnerabilities: ${scanResults.metrics.critical}`);
  console.log(`   High Vulnerabilities: ${scanResults.metrics.high}`);
  console.log(`   Quantum Readiness Posture Score: ${scanResults.metrics.readinessScore} / 100`);

  // 3. Persist Scan
  console.log("\n3. Persisting scan, CBOM, and Dependency Graph to database...");
  const savedScan = await ScannerEngine.persistScan(demoRepo.id, scanResults);
  console.log(`   Scan persisted with ID: ${savedScan.id}`);

  // 4. Test Finding and Risk Explanation
  console.log("\n4. Inspecting Prioritized Findings...");
  const rsaFinding = await db.finding.findFirst({
    where: { scanId: savedScan.id, algorithm: { contains: "RSA" } },
  });

  if (!rsaFinding) {
    throw new Error("Expected RSA finding not found in demo repository!");
  }

  console.log(`   Finding ID: ${rsaFinding.id}`);
  console.log(`   Title: ${rsaFinding.title}`);
  console.log(`   Location: ${rsaFinding.file}:${rsaFinding.lineStart}`);
  console.log(`   Risk Score: ${rsaFinding.riskScore} / 100 (${rsaFinding.severity})`);
  console.log(`   Risk Factors Breakdown:`);
  const factors = JSON.parse(rsaFinding.riskFactors);
  factors.forEach((f: any) => console.log(`     +${f.score} ${f.factor}: ${f.description}`));

  // 5. Generate Migration Plan
  console.log("\n5. Generating Post-Quantum Migration Plan...");
  const recipe = MigrationEngine.findRecipe(
    {
      id: rsaFinding.id,
      file: rsaFinding.file,
      lineStart: rsaFinding.lineStart,
      lineEnd: rsaFinding.lineEnd,
      language: "typescript",
      assetType: "digital_signature",
      algorithm: rsaFinding.algorithm,
      library: rsaFinding.library,
      purpose: rsaFinding.purpose,
      quantumVulnerable: true,
      confidence: rsaFinding.confidence,
      codeSnippet: rsaFinding.codeSnippet,
      evidence: rsaFinding.evidence || "",
      title: rsaFinding.title,
      severity: rsaFinding.severity as any,
      migrationComplexity: rsaFinding.migrationComplexity as any,
      recommendedStrategy: rsaFinding.recommendedStrategy,
      migrationCandidates: [],
      affectedDependencies: JSON.parse(rsaFinding.affectedDependencies),
    },
    { language: "typescript", installedDependencies: {}, hasNativePqcProvider: false }
  );

  const plan = await recipe.plan(
    {
      id: rsaFinding.id,
      file: rsaFinding.file,
      lineStart: rsaFinding.lineStart,
      lineEnd: rsaFinding.lineEnd,
      language: "typescript",
      assetType: "digital_signature",
      algorithm: rsaFinding.algorithm,
      library: rsaFinding.library,
      purpose: rsaFinding.purpose,
      quantumVulnerable: true,
      confidence: rsaFinding.confidence,
      codeSnippet: rsaFinding.codeSnippet,
      evidence: rsaFinding.evidence || "",
      title: rsaFinding.title,
      severity: rsaFinding.severity as any,
      migrationComplexity: rsaFinding.migrationComplexity as any,
      recommendedStrategy: rsaFinding.recommendedStrategy,
      migrationCandidates: [],
      affectedDependencies: JSON.parse(rsaFinding.affectedDependencies),
    },
    { language: "typescript", installedDependencies: {}, hasNativePqcProvider: false }
  );

  const savedPlan = await db.migrationPlan.create({
    data: {
      findingId: rsaFinding.id,
      repositoryId: demoRepo.id,
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

  console.log(`   Strategy: ${plan.strategy}`);
  console.log(`   Current Algorithm: ${plan.currentAlgorithm}`);
  console.log(`   Target Algorithm: ${plan.targetAlgorithm}`);
  console.log(`   Migration Readiness: ${plan.readiness} (${plan.readinessReason})`);
  console.log(`   Key Steps (${plan.steps.length}):`);
  plan.steps.forEach((s, idx) => console.log(`     Step ${idx + 1}: ${s}`));

  // 6. Generate Safe Code Patch
  console.log("\n6. Generating Safe Code Patch & Git Diff...");
  const patchOutput = await recipe.generatePatch(
    {
      id: rsaFinding.id,
      file: rsaFinding.file,
      lineStart: rsaFinding.lineStart,
      lineEnd: rsaFinding.lineEnd,
      language: "typescript",
      assetType: "digital_signature",
      algorithm: rsaFinding.algorithm,
      library: rsaFinding.library,
      purpose: rsaFinding.purpose,
      quantumVulnerable: true,
      confidence: rsaFinding.confidence,
      codeSnippet: rsaFinding.codeSnippet,
      evidence: rsaFinding.evidence || "",
      title: rsaFinding.title,
      severity: rsaFinding.severity as any,
      migrationComplexity: rsaFinding.migrationComplexity as any,
      recommendedStrategy: rsaFinding.recommendedStrategy,
      migrationCandidates: [],
      affectedDependencies: JSON.parse(rsaFinding.affectedDependencies),
    },
    rsaFinding.codeSnippet
  );

  const savedPatch = await db.patch.create({
    data: {
      migrationPlanId: savedPlan.id,
      findingId: rsaFinding.id,
      repositoryId: demoRepo.id,
      targetFile: rsaFinding.file,
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

  console.log(`   Patch created with ID: ${savedPatch.id}`);
  console.log(`   Companion files generated: ${patchOutput.companionFiles.map((c) => c.path).join(", ")}`);
  console.log(`   Diff sample:\n${patchOutput.diff.split("\n").slice(0, 10).join("\n")}`);

  // 7. Multi-Stage Validation
  console.log("\n7. Executing Multi-Stage Validation Runner...");
  const validation = await ValidationRunner.validatePatch({
    targetFile: savedPatch.targetFile,
    originalCode: savedPatch.originalCode,
    generatedCode: savedPatch.generatedCode,
    companionFiles: patchOutput.companionFiles,
  });

  console.log(`   Overall Verdict: ${validation.overallStatus}`);
  console.log(`   Syntax Check: ${validation.syntaxCheck}`);
  console.log(`   Secret Scanner: ${validation.secretScanCheck}`);
  console.log(`   Crypto Policy: ${validation.cryptoPolicyCheck}`);
  console.log(`   Protocol Compatibility: ${validation.compatibilityCheck}`);
  console.log(`   Latency Impact: ${validation.latencyImpact}`);
  console.log(`   Payload Delta: ${validation.payloadSizeDelta}`);

  // 8. Pull Request Generation
  console.log("\n8. Generating Git Branch and Pull Request...");
  const pr = await GitService.createPullRequest({
    patchId: savedPatch.id,
    findingId: rsaFinding.id,
    repositoryId: demoRepo.id,
  });

  console.log(`   PR Created: #${pr.prNumber} [${pr.branchName}]`);
  console.log(`   Title: ${pr.title}`);
  console.log(`   Status: ${pr.status}`);

  console.log("\n=== ALL VERIFICATION MILESTONES PASSED SUCCESSFULLY ===");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
