import React from "react";
import { db } from "@/lib/db";
import { ensureDefaultProject } from "@/lib/seed";
import { PolicyEngine } from "@/lib/policy/engine";
import { PolicyManagerClient } from "@/components/policies/PolicyManagerClient";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const { demoRepo } = await ensureDefaultProject();

  const repo = await db.repository.findFirst({
    where: { id: demoRepo.id },
    include: {
      scans: { orderBy: { createdAt: "desc" }, take: 1 },
      findings: true,
    },
  });

  const findings = repo?.findings || [];
  const rawFindings = findings.map((f) => ({
    id: f.id,
    file: f.file,
    lineStart: f.lineStart,
    lineEnd: f.lineEnd,
    language: "typescript",
    assetType: "digital_signature" as any,
    algorithm: f.algorithm,
    library: f.library,
    purpose: f.purpose,
    quantumVulnerable: true,
    confidence: f.confidence,
    codeSnippet: f.codeSnippet,
    evidence: f.evidence || "",
    title: f.title,
    severity: f.severity as any,
    migrationComplexity: f.migrationComplexity as any,
    recommendedStrategy: f.recommendedStrategy,
    migrationCandidates: [],
    affectedDependencies: [],
  }));

  const violations = await PolicyEngine.evaluateFindings(rawFindings);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Cryptographic Governance Policies
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Enterprise guardrails enforcing NIST FIPS 203/204/205 standards, prohibiting weak primitives and hardcoded keys.
        </p>
      </div>

      <PolicyManagerClient
        initialPolicies={PolicyEngine.DEFAULT_POLICIES}
        initialViolations={violations}
      />
    </div>
  );
}
