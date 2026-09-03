import { CryptoFindingRaw, RiskFactor } from "../scanner/types";

export interface RiskEvaluation {
  score: number;
  factors: RiskFactor[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
}

export class RiskEngine {
  /**
   * Evaluates cryptographic finding and calculates an explainable 0-100 risk score
   */
  public static evaluate(finding: CryptoFindingRaw): RiskEvaluation {
    const factors: RiskFactor[] = [];
    let score = 0;

    // 1. Quantum vulnerability (Shor's / Grover's algorithm exposure)
    if (finding.quantumVulnerable) {
      score += 30;
      factors.push({
        factor: "Quantum Exposure",
        score: 30,
        description: `Algorithm ${finding.algorithm} is vulnerable to Shor's algorithm on Cryptographically Relevant Quantum Computers (CRQCs).`,
      });
    }

    // 2. Protocol / Asset Type Criticality
    if (finding.assetType === "digital_signature") {
      score += 20;
      factors.push({
        factor: "Long-term Signature Integrity",
        score: 20,
        description: "Signatures often require long-term non-repudiation and verification validity across multi-year audit windows.",
      });
    } else if (finding.assetType === "key_establishment") {
      score += 25;
      factors.push({
        factor: "Harvest Now, Decrypt Later (HNDL)",
        score: 25,
        description: "Adversaries can record encrypted sessions today and decrypt with future quantum systems.",
      });
    } else if (finding.assetType === "jwt") {
      score += 20;
      factors.push({
        factor: "Authentication Token Forgery",
        score: 20,
        description: "Compromise of the signing key allows arbitrary forged credentials across service boundaries.",
      });
    } else if (finding.assetType === "tls") {
      score += 15;
      factors.push({
        factor: "In-Transit Transport Security",
        score: 15,
        description: "TLS session encryption protects real-time payload confidentiality across public networks.",
      });
    } else if (finding.assetType === "hashing" && (finding.algorithm === "MD5" || finding.algorithm === "SHA-1")) {
      score += 15;
      factors.push({
        factor: "Deprecated Weak Hash Algorithm",
        score: 15,
        description: `${finding.algorithm} is broken by classical collision attacks and prohibited by NIST SP 800-131A.`,
      });
    }

    // 3. Algorithm & Key Size Weakness
    if (finding.algorithm.includes("RSA")) {
      if (finding.keySize && finding.keySize <= 2048) {
        score += 15;
        factors.push({
          factor: "Inadequate Classical & Quantum Margin (RSA <= 2048)",
          score: 15,
          description: "2048-bit RSA offers only ~112 bits of classical security margin and is completely broken by quantum Shor's factorization.",
        });
      } else {
        score += 10;
        factors.push({
          factor: "RSA Factorization Vulnerability",
          score: 10,
          description: "All modulus sizes of RSA are vulnerable to polynomial-time Shor's algorithm.",
        });
      }
    } else if (finding.algorithm.includes("ECDH") || finding.algorithm.includes("ECDSA") || finding.algorithm.includes("ECC")) {
      score += 10;
      factors.push({
        factor: "Elliptic Curve Discrete Log Vulnerability",
        score: 10,
        description: "Elliptic curve cryptography requires fewer logical qubits to break than equivalent RSA keys.",
      });
    }

    // 4. Hardcoded Secret / Key Storage
    if (finding.assetType === "key_storage" || finding.evidence.includes("hardcoded") || finding.title.includes("Hardcoded")) {
      score += 20;
      factors.push({
        factor: "Hardcoded Cryptographic Secret",
        score: 20,
        description: "Cryptographic keys embedded in source code violate SOC2/PCI-DSS and expose immediate credential leakage.",
      });
    }

    // 5. Internet-Facing or External Exposure
    if (
      finding.file.includes("auth") ||
      finding.file.includes("server") ||
      finding.file.includes("tls") ||
      finding.file.includes("api")
    ) {
      score += 10;
      factors.push({
        factor: "Internet / API Boundary Exposure",
        score: 10,
        description: "Crypto primitive is located on an ingress API, gateway, or authentication service perimeter.",
      });
    }

    // 6. Direct Library Tight Coupling (Low Agility)
    if (finding.migrationComplexity === "HIGH" || finding.migrationComplexity === "COMPLEX") {
      score += 5;
      factors.push({
        factor: "High Migration Coupling",
        score: 5,
        description: "Tightly coupled to specific provider APIs without an agile crypto abstraction layer.",
      });
    }

    // Clamp score between 0 and 100
    score = Math.min(100, Math.max(0, score));

    // Determine severity based on calibrated thresholds
    let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    if (score >= 80) severity = "CRITICAL";
    else if (score >= 60) severity = "HIGH";
    else if (score >= 40) severity = "MEDIUM";
    else if (score >= 20) severity = "LOW";
    else severity = "INFO";

    return {
      score,
      factors,
      severity,
    };
  }
}
