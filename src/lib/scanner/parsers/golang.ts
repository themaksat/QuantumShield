import { CryptoFindingRaw, FileContext } from "../types";

export class GolangCryptoParser {
  public static parse(file: FileContext): CryptoFindingRaw[] {
    const findings: CryptoFindingRaw[] = [];
    const lines = file.lines;

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. rsa.GenerateKey(rand.Reader, 2048)
      if (/rsa\.GenerateKey\s*\(/.test(line)) {
        let keySize = 2048;
        const match = line.match(/rsa\.GenerateKey\s*\([^,]+,\s*(\d+)\)/);
        if (match) {
          keySize = parseInt(match[1], 10);
        }
        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join("\n");

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          language: file.language,
          assetType: "digital_signature",
          algorithm: `RSA-${keySize}`,
          keySize,
          library: "crypto/rsa",
          purpose: "Go RSA key generation for TLS/signing",
          protocol: "PKCS#1",
          quantumVulnerable: true,
          confidence: 0.99,
          codeSnippet: snippet,
          evidence: `Go AST Call: rsa.GenerateKey(..., ${keySize})`,
          title: `Go RSA Key Generation (${keySize}-bit)`,
          severity: keySize <= 2048 ? "CRITICAL" : "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Migrate to crypto-agile signer interface or Go 1.24+ Post-Quantum TLS / ML-KEM",
          migrationCandidates: ["ML-KEM-768 (X25519MLKEM768)", "ML-DSA-65"],
          affectedDependencies: ["go-server", "tls-listener"],
        });
      }

      // 2. crypto/tls configuration with legacy cipher suites
      if (/&tls\.Config\s*\{/.test(line) || /tls\.Config\s*\{/.test(line)) {
        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 10)).join("\n");
        const hasLegacyCipher = /TLS_RSA_|TLS_ECDHE_RSA_/.test(snippet);

        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: Math.min(lines.length, lineNum + 8),
          language: file.language,
          assetType: "tls",
          algorithm: hasLegacyCipher ? "Classical TLS (RSA/ECDHE)" : "TLS 1.2/1.3",
          library: "crypto/tls",
          purpose: "Network listener transport security configuration",
          protocol: "TLS",
          quantumVulnerable: true,
          confidence: 0.95,
          codeSnippet: snippet,
          evidence: "Go tls.Config struct instantiation with classical cipher negotiation",
          title: "Go TLS Transport Configuration",
          severity: "MEDIUM",
          migrationComplexity: "LOW",
          recommendedStrategy: "Enable Hybrid PQC Key Exchange (X25519MLKEM768 in Go 1.24+ tls.Config)",
          migrationCandidates: ["Go 1.24 X25519MLKEM768", "TLS 1.3 Strict"],
          affectedDependencies: ["http-server", "grpc-service"],
        });
      }

      // 3. crypto/ecdh
      if (/ecdh\.(P256|P384|P521|X25519)\s*\(/.test(line)) {
        const snippet = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join("\n");
        findings.push({
          file: file.relativePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          language: file.language,
          assetType: "key_establishment",
          algorithm: "ECDH",
          library: "crypto/ecdh",
          purpose: "Elliptic curve Diffie-Hellman key exchange",
          protocol: "ECDH",
          quantumVulnerable: true,
          confidence: 0.98,
          codeSnippet: snippet,
          evidence: "Go crypto/ecdh curve initialization",
          title: "Go ECDH Key Agreement",
          severity: "HIGH",
          migrationComplexity: "MEDIUM",
          recommendedStrategy: "Adopt hybrid post-quantum key encapsulation with ML-KEM-768",
          migrationCandidates: ["ML-KEM-768 (FIPS 203)", "CIRCL PQC Library"],
          affectedDependencies: ["session-service"],
        });
      }
    });

    return findings;
  }
}
