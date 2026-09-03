import { db } from "../lib/db";
import { ensureDefaultProject } from "../lib/seed";
import { ScannerEngine } from "../lib/scanner/engine";
import { MigrationEngine } from "../lib/migration/recipes";
import { ValidationRunner } from "../lib/validator/runner";
import { GitService } from "../lib/git/service";
import { PolicyEngine } from "../lib/policy/engine";
import { GitHubIngestionService } from "../lib/git/github-service";
import path from "path";

async function runFullAudit() {
  console.log("==================================================");
  console.log("       QUANTUMSHIELD FULL SYSTEM AUDIT");
  console.log("==================================================");

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition: boolean, label: string) {
    totalChecks++;
    if (condition) {
      console.log(`  [PASS] ${label}`);
      passedChecks++;
    } else {
      console.error(`  [FAIL] ${label}`);
    }
  }

  // 1. Database & Seed Initialization
  console.log("\n[1] Testing Database & Default Project Seed...");
  const { org, project, demoRepo } = await ensureDefaultProject();
  assert(!!org && (org.slug === "acme-payments" || org.slug === "default-org"), `Organization exists (${org.name})`);
  assert(!!project && !!project.id, `Project initialized (${project.name})`);
  assert(!!demoRepo && !!demoRepo.id, `Demo Repository initialized (${demoRepo.name})`);

  // 2. HTTP Routes Health Check
  console.log("\n[2] Testing Web Pages & Navigation (HTTP 200)...");
  const pages = [
    "/",
    "/repositories",
    "/inventory",
    "/findings",
    "/graph",
    "/migrations",
    "/policies",
    "/reports",
    "/audit",
    "/settings",
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`http://localhost:3000${page}`);
      assert(res.status === 200, `GET ${page} returned HTTP 200`);
    } catch (e: any) {
      assert(false, `GET ${page} failed: ${e.message}`);
    }
  }

  // 3. Static Analysis Scanner & CBOM
  console.log("\n[3] Testing Static Analysis Scanner on Demo Codebase...");
  const demoPath = path.resolve(process.cwd(), "demo-vulnerable-repo");
  const scanResults = await ScannerEngine.scanDirectory(demoPath, demoRepo.name);
  assert(scanResults.findings.length > 0, `Discovered ${scanResults.findings.length} cryptographic findings`);
  assert(scanResults.cbom.components.length > 0, `Generated ${scanResults.cbom.components.length} CBOM components (CycloneDX 1.6)`);
  assert(scanResults.metrics.readinessScore > 0, `Calculated Posture Score: ${scanResults.metrics.readinessScore}/100`);

  // 4. Persistence of Scan & Graph
  console.log("\n[4] Testing Scan & Dependency Graph Persistence...");
  const persistedScan = await ScannerEngine.persistScan(demoRepo.id, scanResults);
  assert(!!persistedScan.id, `Scan persisted with ID: ${persistedScan.id}`);

  // 5. REST API Endpoints Verification
  console.log("\n[5] Testing REST API Endpoints...");

  // CBOM JSON Export
  try {
    const res = await fetch(`http://localhost:3000/api/projects/${project.id}/cbom/export?format=json`);
    const data = await res.json();
    assert(res.status === 200 && data.bomFormat === "CycloneDX", "GET /api/projects/:id/cbom/export?format=json (CycloneDX 1.6)");
  } catch (e: any) {
    assert(false, `CBOM JSON export error: ${e.message}`);
  }

  // CBOM CSV Export
  try {
    const res = await fetch(`http://localhost:3000/api/projects/${project.id}/cbom/export?format=csv`);
    const csv = await res.text();
    assert(res.status === 200 && csv.includes("Component ID,Algorithm"), "GET /api/projects/:id/cbom/export?format=csv");
  } catch (e: any) {
    assert(false, `CBOM CSV export error: ${e.message}`);
  }

  // CBOM Diff Endpoint
  try {
    const res = await fetch(`http://localhost:3000/api/projects/${project.id}/cbom/diff`);
    const diffData = await res.json();
    assert(res.status === 200 && typeof diffData.hasDiff === "boolean", "GET /api/projects/:id/cbom/diff");
  } catch (e: any) {
    assert(false, `CBOM diff error: ${e.message}`);
  }

  // Dependency Graph Endpoint
  try {
    const res = await fetch(`http://localhost:3000/api/projects/${project.id}/dependency-graph`);
    const graphData = await res.json();
    assert(res.status === 200 && graphData.nodes?.length > 0, `GET /api/projects/:id/dependency-graph (${graphData.nodes?.length || 0} nodes)`);
  } catch (e: any) {
    assert(false, `Dependency graph error: ${e.message}`);
  }

  // 6. Multi-Language Migration Recipes & Remediation Flow
  console.log("\n[6] Testing Multi-Language Migration Recipes...");
  const sampleFindings = await db.finding.findMany({
    where: { scanId: persistedScan.id },
    include: { cryptoAsset: true },
  });
  assert(sampleFindings.length > 0, `Loaded ${sampleFindings.length} findings from latest scan`);

  // Test finding 1: RSA / Classical Signing
  const rsaFinding = sampleFindings.find(f => f.algorithm.includes("RSA") && !f.title.includes("JWT")) || sampleFindings[0];
  console.log(`  Selected RSA finding: "${rsaFinding.title}" (${rsaFinding.file})`);

  // Plan
  const planRes = await fetch(`http://localhost:3000/api/findings/${rsaFinding.id}/migration-plan`, { method: "POST" });
  const planJson = await planRes.json();
  assert(planRes.status === 200 && !!planJson.plan?.id, `Generated Migration Plan: ${planJson.plan?.strategy} (Readiness: ${planJson.plan?.readiness})`);

  // Patch
  const patchRes = await fetch(`http://localhost:3000/api/migrations/${planJson.plan.id}/generate-patch`, { method: "POST" });
  const patchJson = await patchRes.json();
  assert(patchRes.status === 200 && !!patchJson.patch?.diff, `Generated Safe Code Patch (${patchJson.patch?.diff?.split("\n").length} diff lines)`);

  // Validate
  const valRes = await fetch(`http://localhost:3000/api/patches/${patchJson.patch.id}/validate`, { method: "POST" });
  const valJson = await valRes.json();
  assert(valRes.status === 200 && valJson.validation?.checks?.length >= 5, `Executed Multi-Stage Validation (${valJson.validation?.checks?.length} checks evaluated)`);

  // PR Creation
  const prRes = await fetch(`http://localhost:3000/api/patches/${patchJson.patch.id}/create-pr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ findingId: rsaFinding.id, repositoryId: demoRepo.id }),
  });
  const prJson = await prRes.json();
  assert(prRes.status === 200 && !!prJson.pullRequest?.prNumber, `Created Git PR #${prJson.pullRequest?.prNumber} (${prJson.pullRequest?.branch})`);

  // Apply to Codebase
  const applyRes = await fetch(`http://localhost:3000/api/patches/${patchJson.patch.id}/apply`, { method: "POST" });
  const applyJson = await applyRes.json();
  assert(applyRes.status === 200 && applyJson.success === true, `Applied Patch Directly to Codebase (New Posture Score: ${applyJson.newPostureScore}/100)`);

  // 7. Policy Governance Engine
  console.log("\n[7] Testing Policy Governance Engine...");
  const policiesRes = await fetch("http://localhost:3000/api/policies");
  const policiesJson = await policiesRes.json();
  assert(policiesRes.status === 200 && policiesJson.policies?.length > 0, `Governance Engine enforcing ${policiesJson.policies?.length} NIST FIPS guardrails`);

  // 8. Public GitHub Import Verification
  console.log("\n[8] Testing Public GitHub Ingestion (No PAT)...");
  try {
    const ghImportRes = await fetch("http://localhost:3000/api/repositories/github-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoUrl: "https://github.com/octocat/Hello-World",
        name: "octocat-public-verify",
      }),
    });
    const ghJson = await ghImportRes.json();
    assert(ghImportRes.status === 200 && ghJson.success === true, `Cloned public GitHub repo: ${ghJson.repository?.name} (SHA: ${ghJson.repository?.commitSha?.substring(0, 7)})`);
  } catch (e: any) {
    assert(false, `GitHub import failed: ${e.message}`);
  }

  // 9. Audit Log Ledger
  console.log("\n[9] Testing Immutable Compliance Audit Log...");
  const auditEvents = await db.auditEvent.findMany({ take: 5, orderBy: { timestamp: "desc" } });
  assert(auditEvents.length > 0, `Recorded ${auditEvents.length} verifiable audit ledger events`);

  // Audit Summary
  console.log("\n==================================================");
  console.log(`AUDIT RESULTS: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
  if (passedChecks === totalChecks) {
    console.log("STATUS: ALL SYSTEMS VERIFIED AND FULLY OPERATIONAL!");
  } else {
    console.error(`STATUS: ${totalChecks - passedChecks} CHECKS FAILED`);
  }
  console.log("==================================================");
}

runFullAudit().catch(console.error);
