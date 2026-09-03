import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { JavaScriptCryptoParser } from "./parsers/javascript";
import { PythonCryptoParser } from "./parsers/python";
import { GolangCryptoParser } from "./parsers/golang";
import { JavaCryptoParser } from "./parsers/java";
import { RiskEngine } from "../risk/engine";
import { AnalysisContext, CBOMEntry, CBOMReport, CryptoFindingRaw, FileContext } from "./types";
import { db } from "../db";

export class ScannerEngine {
  private static readonly IGNORED_PATTERNS = [
    "**/node_modules/**",
    "**/.git/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/vendor/**",
    "**/venv/**",
    "**/.env*",
  ];

  public static detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".ts":
      case ".tsx":
        return "typescript";
      case ".js":
      case ".jsx":
      case ".mjs":
      case ".cjs":
        return "javascript";
      case ".py":
        return "python";
      case ".go":
        return "golang";
      case ".java":
        return "java";
      case ".c":
      case ".cpp":
      case ".h":
        return "c_cpp";
      case ".rs":
        return "rust";
      default:
        return "unknown";
    }
  }

  public static async scanDirectory(repositoryPath: string, repoName = "local-repo"): Promise<{
    findings: CryptoFindingRaw[];
    cbom: CBOMReport;
    metrics: {
      totalAssets: number;
      quantumVulnerable: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      readinessScore: number;
    };
  }> {
    if (!fs.existsSync(repositoryPath)) {
      throw new Error(`Repository path not found: ${repositoryPath}`);
    }

    const matchedFiles = await fg(["**/*.*"], {
      cwd: repositoryPath,
      ignore: this.IGNORED_PATTERNS,
      absolute: true,
      dot: false,
    });

    const fileContexts: FileContext[] = [];
    const dependencies: Record<string, string> = {};

    // Check for package.json dependencies
    const packageJsonPath = path.join(repositoryPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        Object.assign(dependencies, pkg.dependencies || {}, pkg.devDependencies || {});
      } catch (e) {
        // ignore parse errors
      }
    }

    // Read files
    for (const file of matchedFiles) {
      const language = this.detectLanguage(file);
      if (["typescript", "javascript", "python", "golang", "java"].includes(language)) {
        try {
          const content = fs.readFileSync(file, "utf-8");
          fileContexts.push({
            filePath: file,
            relativePath: path.relative(repositoryPath, file).replace(/\\/g, "/"),
            language,
            content,
            lines: content.split("\n"),
          });
        } catch (e) {
          // skip unreadable files
        }
      }
    }

    const context: AnalysisContext = {
      repositoryRoot: repositoryPath,
      files: fileContexts,
      dependencies,
    };

    const rawFindings: CryptoFindingRaw[] = [];

    // Run parsers
    for (const file of fileContexts) {
      if (file.language === "typescript" || file.language === "javascript") {
        rawFindings.push(...JavaScriptCryptoParser.parse(file));
      } else if (file.language === "python") {
        rawFindings.push(...PythonCryptoParser.parse(file));
      } else if (file.language === "golang") {
        rawFindings.push(...GolangCryptoParser.parse(file));
      } else if (file.language === "java") {
        rawFindings.push(...JavaCryptoParser.parse(file));
      }
    }

    // Evaluate Risk for each finding
    const scoredFindings: CryptoFindingRaw[] = rawFindings.map((f, idx) => {
      const risk = RiskEngine.evaluate(f);
      return {
        ...f,
        id: `crypto_asset_${String(idx + 1).padStart(3, "0")}`,
        riskScore: risk.score,
        riskFactors: risk.factors,
        severity: risk.severity,
      };
    });

    // Build CBOM components
    const cbomEntries: CBOMEntry[] = scoredFindings.map((f) => ({
      id: f.id || `crypto_asset_${Math.random().toString(36).substring(2, 8)}`,
      repository: repoName,
      file: f.file,
      line_start: f.lineStart,
      line_end: f.lineEnd,
      language: f.language,
      asset_type: f.assetType,
      algorithm: f.algorithm,
      key_size: f.keySize || null,
      mode: f.mode || null,
      library: f.library,
      library_version: f.libraryVersion || null,
      purpose: f.purpose,
      protocol: f.protocol || null,
      quantum_vulnerable: f.quantumVulnerable,
      risk_score: f.riskScore || 0,
      confidence: f.confidence,
      migration_status: "unmigrated",
      recommended_strategy: f.recommendedStrategy,
      dependencies: f.affectedDependencies,
      metadata: {
        evidence: f.evidence,
        candidates: f.migrationCandidates,
      },
    }));

    const totalAssets = cbomEntries.length;
    const quantumVulnerable = cbomEntries.filter((c) => c.quantum_vulnerable).length;
    const critical = scoredFindings.filter((f) => f.severity === "CRITICAL").length;
    const high = scoredFindings.filter((f) => f.severity === "HIGH").length;
    const medium = scoredFindings.filter((f) => f.severity === "MEDIUM").length;
    const low = scoredFindings.filter((f) => f.severity === "LOW").length;

    // Readiness score: 100 minus quantum exposure drag
    const avgRisk = totalAssets > 0 ? scoredFindings.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / totalAssets : 0;
    const readinessScore = Math.max(0, Math.round(100 - avgRisk * 0.45 - (critical * 5 + high * 2)));

    const cbom: CBOMReport = {
      bomFormat: "CycloneDX-CBOM",
      specVersion: "1.6",
      serialNumber: `urn:uuid:qs-${Date.now()}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        repository: repoName,
        scannerVersion: "QuantumShield-StaticScanner-1.0.0",
        totalAssets,
        quantumVulnerableAssets: quantumVulnerable,
      },
      components: cbomEntries,
    };

    return {
      findings: scoredFindings,
      cbom,
      metrics: {
        totalAssets,
        quantumVulnerable,
        critical,
        high,
        medium,
        low,
        readinessScore,
      },
    };
  }

  /**
   * Persists scan results into the database
   */
  public static async persistScan(
    repositoryId: string,
    scanData: Awaited<ReturnType<typeof ScannerEngine.scanDirectory>>
  ) {
    const { findings, cbom, metrics } = scanData;

    // Create Scan record
    const scan = await db.scan.create({
      data: {
        repositoryId,
        status: "COMPLETED",
        durationMs: 1420,
        totalAssets: metrics.totalAssets,
        vulnerableCount: metrics.quantumVulnerable,
        riskScore: Math.round(100 - metrics.readinessScore),
        postureScore: metrics.readinessScore,
        metadata: JSON.stringify({
          critical: metrics.critical,
          high: metrics.high,
          medium: metrics.medium,
          low: metrics.low,
        }),
        completedAt: new Date(),
      },
    });

    // Create CryptoAsset and Finding records
    for (const f of findings) {
      const asset = await db.cryptoAsset.create({
        data: {
          id: `${scan.id}_${f.id || Math.random().toString(36).substring(2, 8)}`,
          scanId: scan.id,
          repositoryId,
          file: f.file,
          lineStart: f.lineStart,
          lineEnd: f.lineEnd,
          language: f.language,
          assetType: f.assetType,
          algorithm: f.algorithm,
          keySize: f.keySize,
          mode: f.mode,
          library: f.library,
          libraryVersion: f.libraryVersion,
          purpose: f.purpose,
          protocol: f.protocol,
          quantumVulnerable: f.quantumVulnerable,
          riskScore: f.riskScore || 0,
          confidence: f.confidence,
          migrationStatus: "unmigrated",
          recommendedStrategy: f.recommendedStrategy,
          dependencies: JSON.stringify(f.affectedDependencies),
          metadata: JSON.stringify({
            evidence: f.evidence,
            migrationCandidates: f.migrationCandidates,
          }),
        },
      });

      await db.finding.create({
        data: {
          scanId: scan.id,
          repositoryId,
          cryptoAssetId: asset.id,
          title: f.title,
          severity: f.severity,
          status: "DISCOVERED",
          algorithm: f.algorithm,
          keyLength: f.keySize,
          library: f.library,
          file: f.file,
          lineStart: f.lineStart,
          lineEnd: f.lineEnd,
          codeSnippet: f.codeSnippet,
          purpose: f.purpose,
          quantumVulnerabilityDetail: f.quantumVulnerable
            ? `Vulnerable to polynomial-time quantum algorithms (Shor's/Proos-Zalka). Can be broken by a Cryptographically Relevant Quantum Computer.`
            : `Classically insecure or legacy algorithm; remediation recommended under modern cryptographic governance.`,
          migrationComplexity: f.migrationComplexity,
          recommendedStrategy: f.recommendedStrategy,
          confidence: f.confidence,
          riskScore: f.riskScore || 0,
          riskFactors: JSON.stringify(f.riskFactors || []),
          affectedDependencies: JSON.stringify(f.affectedDependencies),
          evidence: f.evidence,
        },
      });
    }

    // Build & Persist Dependency Graph Nodes and Edges
    await this.persistDependencyGraph(scan.id, repositoryId, findings);

    // Record Audit Event
    await db.auditEvent.create({
      data: {
        actor: "scanner-engine",
        action: "SCAN_EXECUTED",
        objectType: "Scan",
        objectId: scan.id,
        metadata: JSON.stringify({
          totalAssets: metrics.totalAssets,
          vulnerableCount: metrics.quantumVulnerable,
          readinessScore: metrics.readinessScore,
        }),
      },
    });

    return scan;
  }

  private static async persistDependencyGraph(
    scanId: string,
    repositoryId: string,
    findings: CryptoFindingRaw[]
  ) {
    // Root service node
    const repo = await db.repository.findUnique({ where: { id: repositoryId } });
    const serviceNodeId = `node-svc-${repositoryId}`;

    await db.dependencyNode.create({
      data: {
        scanId,
        repositoryId,
        nodeId: serviceNodeId,
        label: repo?.name || "Root Service",
        nodeType: "SERVICE",
        metadata: JSON.stringify({ role: "Root Repository Service" }),
      },
    });

    const fileMap = new Set<string>();
    const libMap = new Set<string>();

    for (const f of findings) {
      // File Node
      const fileNodeId = `node-file-${f.file.replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (!fileMap.has(fileNodeId)) {
        fileMap.add(fileNodeId);
        await db.dependencyNode.create({
          data: {
            scanId,
            repositoryId,
            nodeId: fileNodeId,
            label: f.file,
            nodeType: "FILE",
            metadata: JSON.stringify({ language: f.language }),
          },
        });

        // Edge: Service -> File
        await db.dependencyEdge.create({
          data: {
            scanId,
            repositoryId,
            sourceId: serviceNodeId,
            targetId: fileNodeId,
            relation: "CONTAINS",
            confidence: 1.0,
          },
        });
      }

      // Library Node
      const libNodeId = `node-lib-${f.library.replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (!libMap.has(libNodeId)) {
        libMap.add(libNodeId);
        await db.dependencyNode.create({
          data: {
            scanId,
            repositoryId,
            nodeId: libNodeId,
            label: f.library,
            nodeType: "CRYPTO_LIBRARY",
            metadata: JSON.stringify({ library: f.library }),
          },
        });
      }

      // Edge: File -> Library
      await db.dependencyEdge.create({
        data: {
          scanId,
          repositoryId,
          sourceId: fileNodeId,
          targetId: libNodeId,
          relation: "IMPORTS",
          confidence: 0.95,
        },
      });

      // Algorithm Node
      const algoNodeId = `node-algo-${f.algorithm.replace(/[^a-zA-Z0-9]/g, "_")}-${Math.random().toString(36).substring(2, 6)}`;
      await db.dependencyNode.create({
        data: {
          scanId,
          repositoryId,
          nodeId: algoNodeId,
          label: f.algorithm,
          nodeType: "ALGORITHM",
          metadata: JSON.stringify({
            quantumVulnerable: f.quantumVulnerable,
            keySize: f.keySize,
            purpose: f.purpose,
            riskScore: f.riskScore,
          }),
        },
      });

      // Edge: Library -> Algorithm
      await db.dependencyEdge.create({
        data: {
          scanId,
          repositoryId,
          sourceId: libNodeId,
          targetId: algoNodeId,
          relation: "IMPLEMENTS",
          confidence: 0.98,
        },
      });
    }
  }
}
