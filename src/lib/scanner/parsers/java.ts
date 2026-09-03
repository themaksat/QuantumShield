import { CryptoFindingRaw, FileContext } from "../types";

export class JavaCryptoParser {
  public static parse(file: FileContext): CryptoFindingRaw[] {
    const findings: CryptoFindingRaw[] = [];
    const lines = file.lines;

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. KeyPairGenerator.getInstance("RSA")
      if (/KeyPairGenerator\.getInstance\s*\(\s*["']([^"']+)["']\s*\)/.test(line)) {
        const match = line.match(/KeyPairGenerator\.getInstance\s*\(\s*["']([^"']+)["']\s*\)/);
        const algo = match ? match[1] : "RSA";
        let keySize = 2048;

        // Check next few lines for .initialize(size)
        const contextChunk = lines.slice(index, Math.min(lines.length, index + 5)).join(" ");
        const initMatch = contextChunk.match(/\.initialize\s*\(\s*(\d+)\s*\)/);
        if (initMatch) {
          keySize = parseInt(initMatch[1], 10);
        }

        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 5)).join("\n");

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: Math.min(lines.length, lineNum + 4),
          language: file.language,
          assetType: "digital_signature",
          algorithm: `${algo}-${keySize}`,
          keySize,
          library: "java.security:JCA",
          purpose: "JCA KeyPairGenerator asymmetric key creation",
          quantumVulnerable: algo.toUpperCase().includes("RSA") || algo.toUpperCase().includes("EC"),
          confidence: 0.99,
          codeSnippet: snippet,
          evidence: `JCA KeyPairGenerator.getInstance("${algo}") initialized with ${keySize} bits`,
          title: `Java JCA ${algo}-${keySize} Key Pair Generation`,
          severity: "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Integrate Bouncy Castle PQC provider (BCPQC) with FIPS 204 ML-DSA",
          migrationCandidates: ["Bouncy Castle ML-DSA", "OpenJCEPlus PQC"],
          affectedDependencies: ["security-provider", "settlement-core"],
        });
      }

      // 2. Signature.getInstance("SHA256withRSA")
      if (/Signature\.getInstance\s*\(\s*["']([^"']+)["']\s*\)/.test(line)) {
        const match = line.match(/Signature\.getInstance\s*\(\s*["']([^"']+)["']\s*\)/);
        const algo = match ? match[1] : "SHA256withRSA";
        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 4)).join("\n");

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          language: file.language,
          assetType: "digital_signature",
          algorithm: algo,
          library: "java.security:Signature",
          purpose: "Digital signature calculation and verification",
          quantumVulnerable: true,
          confidence: 0.98,
          codeSnippet: snippet,
          evidence: `JCA Signature.getInstance("${algo}")`,
          title: `Java JCA Signature: ${algo}`,
          severity: "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Introduce crypto-agile Java signer abstraction and dual-signature verification",
          migrationCandidates: ["BouncyCastle ML-DSA-65", "SLH-DSA"],
          affectedDependencies: ["payment-signer"],
        });
      }

      // 3. KeyAgreement.getInstance("ECDH")
      if (/KeyAgreement\.getInstance\s*\(\s*["']([^"']+)["']\s*\)/.test(line)) {
        const match = line.match(/KeyAgreement\.getInstance\s*\(\s*["']([^"']+)["']\s*\)/);
        const algo = match ? match[1] : "ECDH";
        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join("\n");

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          language: file.language,
          assetType: "key_establishment",
          algorithm: algo,
          library: "javax.crypto:KeyAgreement",
          purpose: "Session key establishment via asymmetric key agreement",
          quantumVulnerable: true,
          confidence: 0.98,
          codeSnippet: snippet,
          evidence: `JCA KeyAgreement.getInstance("${algo}")`,
          title: `Java KeyAgreement: ${algo}`,
          severity: "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Transition to Hybrid ML-KEM-768 key encapsulation via Bouncy Castle PQC",
          migrationCandidates: ["ML-KEM-768 (FIPS 203)", "BouncyCastle PQC KEM"],
          affectedDependencies: ["session-manager"],
        });
      }
    });

    return findings;
  }
}
