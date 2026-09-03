export type ReadinessStatus = "READY" | "PARTIALLY_READY" | "BLOCKED";

export interface EnvironmentContext {
  language: string;
  nodeVersion?: string;
  pythonVersion?: string;
  installedDependencies: Record<string, string>;
  hasNativePqcProvider: boolean;
}

export interface MigrationAssessment {
  readiness: ReadinessStatus;
  reason: string;
  requiredActions: string[];
  affectedSystems: string[];
  compatibilityRisks: string[];
  performanceImpactEstimate: {
    handshakeSizeDelta: string;
    signatureSizeDelta: string;
    latencyImpactPercent: number;
    cpuOverheadPercent: number;
  };
}

export interface MigrationPlanOutput {
  recipeId: string;
  strategy: string;
  currentAlgorithm: string;
  targetAlgorithm: string;
  readiness: ReadinessStatus;
  readinessReason: string;
  steps: string[];
  risks: string[];
  prerequisites: string[];
  securityAssumptions: string[];
  rollbackInstructions: string[];
}

export interface GeneratedPatchOutput {
  targetFile: string;
  originalCode: string;
  generatedCode: string;
  diff: string;
  companionFiles: Array<{
    path: string;
    content: string;
    purpose: string;
  }>;
  rationale: string;
  rollbackNotes: string;
  securityAssumptions: string;
  confidence: number;
}
