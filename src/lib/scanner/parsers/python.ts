import { CryptoFindingRaw, FileContext } from "../types";

export class PythonCryptoParser {
  public static parse(file: FileContext): CryptoFindingRaw[] {
    const findings: CryptoFindingRaw[] = [];
    const lines = file.lines;

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Weak Hashing: hashlib.sha1() or hashlib.md5()
      if (/hashlib\.(sha1|md5)\s*\(/.test(line)) {
        const match = line.match(/hashlib\.(sha1|md5)\s*\(/);
        const algo = match ? match[1].toUpperCase() : "SHA-1";
        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join("\n");

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          language: file.language,
          assetType: "hashing",
          algorithm: algo,
          library: "python:hashlib",
          purpose: "Message digest and fingerprint calculation",
          quantumVulnerable: false, // Weak classically
          confidence: 0.99,
          codeSnippet: snippet,
          evidence: `Direct invocation of deprecated hashing primitive: hashlib.${algo.toLowerCase()}()`,
          title: `Deprecated Insecure Hash Function: ${algo}`,
          severity: "HIGH",
          migrationComplexity: "LOW",
          recommendedStrategy: `Migrate to collision-resistant SHA-256 / SHA-384 or SHA-3 / SHAKE-256 (FIPS 202)`,
          migrationCandidates: ["SHA-256", "SHA-384", "SHA3-256", "SHAKE-256"],
          affectedDependencies: ["data-fingerprinting", "integrity-service"],
        });
      }

      // 2. cryptography.hazmat RSA key generation
      if (/rsa\.generate_private_key\s*\(/.test(line) || /generate_private_key\s*\(/.test(line)) {
        let keySize = 2048;
        // Search surrounding lines for key_size=
        const contextChunk = lines.slice(index, Math.min(lines.length, index + 6)).join(" ");
        const keySizeMatch = contextChunk.match(/key_size\s*=\s*(\d+)/);
        if (keySizeMatch) {
          keySize = parseInt(keySizeMatch[1], 10);
        }

        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 6)).join("\n");

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: Math.min(lines.length, lineNum + 5),
          language: file.language,
          assetType: "digital_signature",
          algorithm: `RSA-${keySize}`,
          keySize,
          library: "cryptography.hazmat",
          purpose: "Asymmetric private key generation",
          protocol: "PKCS#1 / PSS",
          quantumVulnerable: true,
          confidence: 0.98,
          codeSnippet: snippet,
          evidence: `Invocation: rsa.generate_private_key(key_size=${keySize})`,
          title: `Quantum-Vulnerable RSA Key Generation (RSA-${keySize})`,
          severity: keySize <= 2048 ? "CRITICAL" : "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Refactor to crypto-agile interface and plan migration toward NIST FIPS 204 (ML-DSA-65)",
          migrationCandidates: ["ML-DSA-65 (FIPS 204)", "SLH-DSA (FIPS 205)"],
          affectedDependencies: ["auth-backend", "key-lifecycle"],
        });
      }

      // 3. Python JWT RS256/ES256
      if (/jwt\.encode\s*\(/.test(line) || /jwt\.decode\s*\(/.test(line)) {
        const contextChunk = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 4)).join(" ");
        let algo = "RS256";
        const algoMatch = contextChunk.match(/algorithm\s*=\s*["']([^"']+)["']/);
        if (algoMatch) {
          algo = algoMatch[1];
        }

        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join("\n");

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          language: file.language,
          assetType: "jwt",
          algorithm: algo,
          keySize: 2048,
          library: "pyjwt",
          purpose: "Token serialization and signature verification",
          protocol: "JWT",
          quantumVulnerable: algo.startsWith("RS") || algo.startsWith("ES"),
          confidence: 0.96,
          codeSnippet: snippet,
          evidence: `Call: jwt.encode/decode with algorithm='${algo}'`,
          title: `Python JWT Signing with ${algo}`,
          severity: "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Wrap token signing in a crypto-agile provider with PQC capability",
          migrationCandidates: ["ML-DSA Agility Layer", "Dual-Signer Architecture"],
          affectedDependencies: ["identity-provider", "session-manager"],
        });
      }

      // 4. PyCryptodome RSA/ECC
      if (/Crypto\.PublicKey\.RSA/.test(line) || /RSA\.generate\s*\(/.test(line)) {
        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join("\n");
        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          language: file.language,
          assetType: "digital_signature",
          algorithm: "RSA",
          library: "pycryptodome",
          purpose: "PyCryptodome RSA key generation or cipher operations",
          quantumVulnerable: true,
          confidence: 0.95,
          codeSnippet: snippet,
          evidence: "PyCryptodome RSA module invocation",
          title: "Legacy PyCryptodome RSA Usage",
          severity: "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Upgrade to Python cryptography library with post-quantum support",
          migrationCandidates: ["liboqs-python (ML-KEM / ML-DSA)", "cryptography >= 42.0"],
          affectedDependencies: ["settlement-service"],
        });
      }
    });

    return findings;
  }
}
