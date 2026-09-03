export type AssetType =
  | "digital_signature"
  | "key_establishment"
  | "symmetric_crypto"
  | "hashing"
  | "certificate"
  | "pki"
  | "tls"
  | "ssh"
  | "jwt"
  | "key_storage"
  | "hsm"
  | "kms"
  | "custom_crypto"
  | "unknown";

export interface FileContext {
  filePath: string;
  relativePath: string;
  language: string;
  content: string;
  lines: string[];
}

export interface AnalysisContext {
  repositoryRoot: string;
  files: FileContext[];
  dependencies: Record<string, string>;
}

export interface RiskFactor {
  factor: string;
  score: number;
  description: string;
}

export interface CryptoFindingRaw {
  id?: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  language: string;
  assetType: AssetType;
  algorithm: string;
  keySize?: number;
  mode?: string;
  library: string;
  libraryVersion?: string;
  purpose: string;
  protocol?: string;
  quantumVulnerable: boolean;
  confidence: number;
  codeSnippet: string;
  evidence: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  migrationComplexity: "LOW" | "MEDIUM" | "HIGH" | "COMPLEX";
  recommendedStrategy: string;
  migrationCandidates: string[];
  affectedDependencies: string[];
  riskScore?: number;
  riskFactors?: RiskFactor[];
}

export interface CryptoDetector {
  id: string;
  name: string;
  languages: string[];
  analyze(context: AnalysisContext): Promise<CryptoFindingRaw[]>;
}

export interface CBOMEntry {
  id: string;
  repository: string;
  file: string;
  line_start: number;
  line_end: number;
  language: string;
  asset_type: AssetType;
  algorithm: string;
  key_size: number | null;
  mode: string | null;
  library: string;
  library_version: string | null;
  purpose: string;
  protocol: string | null;
  quantum_vulnerable: boolean;
  risk_score: number;
  confidence: number;
  migration_status: string;
  recommended_strategy: string;
  dependencies: string[];
  metadata: Record<string, any>;
}

export interface CBOMReport {
  bomFormat: "CycloneDX-CBOM" | "QuantumShield-CBOM";
  specVersion: "1.6";
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    repository: string;
    scannerVersion: string;
    totalAssets: number;
    quantumVulnerableAssets: number;
  };
  components: CBOMEntry[];
}
