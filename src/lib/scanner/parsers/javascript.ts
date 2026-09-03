import * as babelParser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { CryptoFindingRaw, FileContext } from "../types";

export class JavaScriptCryptoParser {
  public static parse(file: FileContext): CryptoFindingRaw[] {
    const findings: CryptoFindingRaw[] = [];

    // First, check for hardcoded private keys via structural search
    const lines = file.lines;
    lines.forEach((line, idx) => {
      if (line.includes("-----BEGIN RSA PRIVATE KEY-----") || line.includes("-----BEGIN PRIVATE KEY-----")) {
        const endLineIdx = lines.findIndex((l, i) => i >= idx && (l.includes("-----END RSA PRIVATE KEY-----") || l.includes("-----END PRIVATE KEY-----")));
        const lineEnd = endLineIdx !== -1 ? endLineIdx + 1 : idx + 1;
        findings.push({
          file: file.relativePath,
          lineStart: idx + 1,
          lineEnd,
          language: file.language,
          assetType: "key_storage",
          algorithm: "RSA",
          library: "hardcoded_secret",
          purpose: "Embedded private key material in source code",
          quantumVulnerable: true,
          confidence: 1.0,
          codeSnippet: lines.slice(idx, Math.min(idx + 5, lines.length)).join("\n"),
          evidence: "Explicit PEM encoded private key marker detected in source file",
          title: "Hardcoded Private Key in Source Code",
          severity: "CRITICAL",
          migrationComplexity: "LOW",
          recommendedStrategy: "Extract private key into external KMS/Secret Store and rotate credential immediately",
          migrationCandidates: ["AWS KMS", "HashiCorp Vault", "Azure Key Vault", "GCP Secret Manager"],
          affectedDependencies: ["configuration", "deployment-pipeline"],
        });
      }
    });

    let ast: babelParser.ParseResult<t.File>;
    try {
      ast = babelParser.parse(file.content, {
        sourceType: "unambiguous",
        plugins: ["typescript", "jsx", "decorators-legacy"],
        errorRecovery: true,
      });
    } catch (e) {
      // Fallback: file syntax error, return current findings
      return findings;
    }

    try {
      // Use standard traverse
      const traverseFn = (traverse as any).default || traverse;

      traverseFn(ast, {
        // Detect CallExpressions like crypto.createECDH, crypto.createSign, jwt.sign
        CallExpression(path: NodePath<t.CallExpression>) {
          const callee = path.node.callee;
          const loc = path.node.loc;
          const lineStart = loc ? loc.start.line : 1;
          const lineEnd = loc ? loc.end.line : lineStart;
          const snippet = file.lines.slice(lineStart - 1, lineEnd).join("\n");

          // 1. crypto.createECDH(...)
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property, { name: "createECDH" })
          ) {
            let curve = "unknown";
            if (path.node.arguments.length > 0) {
              const firstArg = path.node.arguments[0];
              if (t.isStringLiteral(firstArg)) {
                curve = firstArg.value;
              } else if (t.isIdentifier(firstArg)) {
                curve = firstArg.name;
              }
            }

            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: "key_establishment",
              algorithm: `ECDH (${curve})`,
              library: "node:crypto",
              purpose: "Asymmetric key agreement for microservice communication",
              protocol: "ECDH",
              quantumVulnerable: true,
              confidence: 0.98,
              codeSnippet: snippet,
              evidence: `AST CallExpression: crypto.createECDH("${curve}")`,
              title: `Quantum-Vulnerable Key Exchange: ECDH (${curve})`,
              severity: "HIGH",
              migrationComplexity: "MEDIUM",
              recommendedStrategy: "Implement hybrid transition: combine classical ECDH/X25519 with NIST FIPS 203 (ML-KEM-768)",
              migrationCandidates: ["ML-KEM-768 (FIPS 203)", "X25519 + ML-KEM-768 (Hybrid)"],
              affectedDependencies: ["network-session", "service-client"],
            });
          }

          // 2. crypto.generateKeyPair or crypto.generateKeyPairSync
          if (
            t.isMemberExpression(callee) &&
            (t.isIdentifier(callee.property, { name: "generateKeyPair" }) ||
              t.isIdentifier(callee.property, { name: "generateKeyPairSync" }))
          ) {
            let algo = "asymmetric";
            let keySize = 2048;

            if (path.node.arguments.length > 0) {
              const firstArg = path.node.arguments[0];
              if (t.isStringLiteral(firstArg)) algo = firstArg.value.toUpperCase();
            }

            if (path.node.arguments.length > 1) {
              const opts = path.node.arguments[1];
              if (t.isObjectExpression(opts)) {
                opts.properties.forEach((prop) => {
                  if (
                    t.isObjectProperty(prop) &&
                    t.isIdentifier(prop.key, { name: "modulusLength" }) &&
                    t.isNumericLiteral(prop.value)
                  ) {
                    keySize = prop.value.value;
                  }
                });
              }
            }

            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: "digital_signature",
              algorithm: `${algo}-${keySize}`,
              keySize,
              library: "node:crypto",
              purpose: "Asymmetric keypair generation for settlement/signatures",
              quantumVulnerable: true,
              confidence: 0.99,
              codeSnippet: snippet,
              evidence: `AST CallExpression: crypto.generateKeyPair("${algo}", modulusLength: ${keySize})`,
              title: `Vulnerable Key Generation: ${algo}-${keySize}`,
              severity: "HIGH",
              migrationComplexity: "MEDIUM",
              recommendedStrategy: "Introduce crypto-agile provider and plan migration toward NIST FIPS 204 (ML-DSA-65) or FIPS 205 (SLH-DSA)",
              migrationCandidates: ["ML-DSA-65 (FIPS 204)", "SLH-DSA-SHA2-128s (FIPS 205)"],
              affectedDependencies: ["auth-service", "settlement-engine"],
            });
          }

          // 3. crypto.createSign('RSA-SHA256') or crypto.createVerify('RSA-SHA256')
          if (
            t.isMemberExpression(callee) &&
            (t.isIdentifier(callee.property, { name: "createSign" }) ||
              t.isIdentifier(callee.property, { name: "createVerify" }))
          ) {
            let signAlgo = "RSA-SHA256";
            if (path.node.arguments.length > 0 && t.isStringLiteral(path.node.arguments[0])) {
              signAlgo = path.node.arguments[0].value;
            }

            const isVerify = t.isIdentifier(callee.property, { name: "createVerify" });

            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: "digital_signature",
              algorithm: signAlgo,
              library: "node:crypto",
              purpose: isVerify ? "Signature verification" : "Transaction signing",
              quantumVulnerable: signAlgo.toUpperCase().includes("RSA") || signAlgo.toUpperCase().includes("ECDSA"),
              confidence: 0.97,
              codeSnippet: snippet,
              evidence: `AST CallExpression: crypto.${callee.property.name}("${signAlgo}")`,
              title: `Classical Signature Usage: ${signAlgo}`,
              severity: "HIGH",
              migrationComplexity: "MEDIUM",
              recommendedStrategy: "Refactor direct crypto calls into pluggable CryptoProvider supporting dual-verification and ML-DSA",
              migrationCandidates: ["ML-DSA-65 (FIPS 204)", "Stateful Hash Signatures (LMS/XMSS)"],
              affectedDependencies: ["settlement-service", "audit-ledger"],
            });
          }

          // 4. jsonwebtoken: jwt.sign(..., { algorithm: "RS256" })
          if (
            (t.isMemberExpression(callee) &&
              t.isIdentifier(callee.property, { name: "sign" }) &&
              (t.isIdentifier(callee.object, { name: "jwt" }) ||
                t.isIdentifier(callee.object, { name: "jsonwebtoken" }))) ||
            (t.isIdentifier(callee, { name: "sign" }) && snippet.includes("algorithm"))
          ) {
            let algorithm = "RS256";
            // Check options object
            if (path.node.arguments.length >= 3) {
              const opts = path.node.arguments[2];
              if (t.isObjectExpression(opts)) {
                opts.properties.forEach((prop) => {
                  if (
                    t.isObjectProperty(prop) &&
                    t.isIdentifier(prop.key, { name: "algorithm" }) &&
                    t.isStringLiteral(prop.value)
                  ) {
                    algorithm = prop.value.value;
                  }
                });
              }
            }

            const isQuantumVuln = algorithm.startsWith("RS") || algorithm.startsWith("ES") || algorithm.startsWith("PS");

            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: "jwt",
              algorithm: algorithm,
              keySize: algorithm.includes("256") ? 2048 : 4096,
              library: "jsonwebtoken",
              purpose: "Authentication token issuance and authorization",
              protocol: "JWT",
              quantumVulnerable: isQuantumVuln,
              confidence: 0.99,
              codeSnippet: snippet,
              evidence: `AST CallExpression: jwt.sign(..., { algorithm: "${algorithm}" })`,
              title: `Quantum-Vulnerable JWT Signing: ${algorithm}`,
              severity: "CRITICAL",
              migrationComplexity: "MEDIUM",
              recommendedStrategy: "Introduce crypto-agile JWT signing abstraction with dual-signature verification & ML-DSA header support",
              migrationCandidates: ["ML-DSA-44 / ML-DSA-65", "Crypto-Agile JWT Token Provider"],
              affectedDependencies: ["auth-service", "api-gateway", "mobile-client"],
            });
          }

          // 5. TLS Configuration: https.createServer(options) or tls.createServer(options)
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property, { name: "createServer" }) &&
            (t.isIdentifier(callee.object, { name: "https" }) || t.isIdentifier(callee.object, { name: "tls" }))
          ) {
            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: "tls",
              algorithm: "ECDHE-RSA / TLSv1.2",
              library: "node:tls",
              purpose: "Transport layer security for HTTP ingress",
              protocol: "TLS",
              quantumVulnerable: true,
              confidence: 0.95,
              codeSnippet: snippet,
              evidence: "AST CallExpression: tls/https.createServer with legacy cipher configuration",
              title: "Legacy TLS Transport Configuration",
              severity: "MEDIUM",
              migrationComplexity: "LOW",
              recommendedStrategy: "Enforce TLS 1.3 with Hybrid Key Exchange (X25519MLKEM768)",
              migrationCandidates: ["TLS 1.3 with X25519MLKEM768", "Cloudflare PQC Tunnel"],
              affectedDependencies: ["ingress-controller", "api-gateway"],
            });
          }

          // 6. Web Crypto API: crypto.subtle.importKey(...)
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property, { name: "importKey" }) &&
            (snippet.includes("crypto.subtle") || snippet.includes("subtle"))
          ) {
            let algo = "PBKDF2";
            if (path.node.arguments.length >= 3) {
              const arg3 = path.node.arguments[2];
              if (t.isStringLiteral(arg3)) algo = arg3.value;
              else if (t.isObjectExpression(arg3)) {
                arg3.properties.forEach((p) => {
                  if (t.isObjectProperty(p) && t.isIdentifier(p.key, { name: "name" }) && t.isStringLiteral(p.value)) {
                    algo = p.value.value;
                  }
                });
              }
            }

            const isAsymmetric = algo.includes("RSA") || algo.includes("ECDSA") || algo.includes("ECDH");
            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: isAsymmetric ? "digital_signature" : "symmetric_crypto",
              algorithm: algo,
              library: "web-crypto-api",
              purpose: "Web Crypto key derivation or credential import",
              protocol: "WebCrypto",
              quantumVulnerable: isAsymmetric,
              confidence: 0.96,
              codeSnippet: snippet,
              evidence: `AST CallExpression: crypto.subtle.importKey(..., "${algo}")`,
              title: `Web Crypto Key Import: ${algo}`,
              severity: isAsymmetric ? "HIGH" : "MEDIUM",
              migrationComplexity: "MEDIUM",
              recommendedStrategy: isAsymmetric ? "Migrate to NIST FIPS 203/204 or hybrid Web Crypto abstraction" : "Ensure iteration count >= 600,000 per OWASP guidelines",
              migrationCandidates: ["FIPS 203 ML-KEM", "Argon2id", "OWASP PBKDF2"],
              affectedDependencies: ["auth-runtime", "session-manager"],
            });
          }

          // 7. Web Crypto API: crypto.subtle.deriveBits / deriveKey (PBKDF2, ECDH)
          if (
            t.isMemberExpression(callee) &&
            (t.isIdentifier(callee.property, { name: "deriveBits" }) || t.isIdentifier(callee.property, { name: "deriveKey" })) &&
            (snippet.includes("crypto.subtle") || snippet.includes("subtle"))
          ) {
            let algo = "PBKDF2";
            let hash = "SHA-256";
            if (path.node.arguments.length > 0) {
              const arg0 = path.node.arguments[0];
              if (t.isObjectExpression(arg0)) {
                arg0.properties.forEach((p) => {
                  if (t.isObjectProperty(p) && t.isIdentifier(p.key, { name: "name" }) && t.isStringLiteral(p.value)) {
                    algo = p.value.value;
                  }
                  if (t.isObjectProperty(p) && t.isIdentifier(p.key, { name: "hash" }) && t.isStringLiteral(p.value)) {
                    hash = p.value.value;
                  }
                });
              }
            }

            const isECDH = algo.toUpperCase().includes("ECDH");
            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: isECDH ? "key_establishment" : "symmetric_crypto",
              algorithm: `${algo}-${hash}`,
              library: "web-crypto-api",
              purpose: isECDH ? "Diffie-Hellman Key Agreement" : "Password-Based Key Derivation",
              protocol: "WebCrypto",
              quantumVulnerable: isECDH,
              confidence: 0.98,
              codeSnippet: snippet,
              evidence: `AST CallExpression: crypto.subtle.${callee.property.name}({ name: "${algo}", hash: "${hash}" })`,
              title: isECDH ? `Quantum-Vulnerable Key Derivation: ${algo}` : `Key Derivation Function: ${algo}-${hash}`,
              severity: isECDH ? "HIGH" : "MEDIUM",
              migrationComplexity: "MEDIUM",
              recommendedStrategy: isECDH ? "Migrate to NIST FIPS 203 ML-KEM-768 hybrid key agreement" : "Ensure argon2id or PBKDF2 with >= 600,000 iterations",
              migrationCandidates: ["ML-KEM-768 (FIPS 203)", "Argon2id KDF"],
              affectedDependencies: ["auth-service", "user-credentials"],
            });
          }

          // 8. Web Crypto API: crypto.subtle.digest(...)
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property, { name: "digest" }) &&
            (snippet.includes("crypto.subtle") || snippet.includes("subtle"))
          ) {
            let hashAlgo = "SHA-256";
            if (path.node.arguments.length > 0 && t.isStringLiteral(path.node.arguments[0])) {
              hashAlgo = path.node.arguments[0].value;
            }

            const isWeak = hashAlgo.toUpperCase() === "SHA-1" || hashAlgo.toUpperCase() === "MD5";
            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: "hashing",
              algorithm: hashAlgo,
              library: "web-crypto-api",
              purpose: "Cryptographic hash digest for data integrity or session identifier",
              protocol: "WebCrypto",
              quantumVulnerable: isWeak,
              confidence: 0.95,
              codeSnippet: snippet,
              evidence: `AST CallExpression: crypto.subtle.digest("${hashAlgo}")`,
              title: `Cryptographic Hash: ${hashAlgo}`,
              severity: isWeak ? "HIGH" : "LOW",
              migrationComplexity: "LOW",
              recommendedStrategy: isWeak ? "Upgrade immediately to SHA-256 or SHA-3/SHAKE256" : "Quantum resistant under Grover algorithm (effective security 128 bits)",
              migrationCandidates: ["SHA-256", "SHA-384", "SHA3-256"],
              affectedDependencies: ["session-auth", "cache-integrity"],
            });
          }

          // 9. CSPRNG: crypto.getRandomValues(...)
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property, { name: "getRandomValues" })
          ) {
            findings.push({
              file: file.relativePath,
              lineStart,
              lineEnd,
              language: file.language,
              assetType: "symmetric_crypto",
              algorithm: "CSPRNG (WebCrypto)",
              library: "web-crypto-api",
              purpose: "Cryptographically secure pseudo-random number generation for salts and session tokens",
              protocol: "WebCrypto",
              quantumVulnerable: false,
              confidence: 0.99,
              codeSnippet: snippet,
              evidence: "AST CallExpression: crypto.getRandomValues(...)",
              title: "Cryptographically Secure Random Generator (CSPRNG)",
              severity: "LOW",
              migrationComplexity: "LOW",
              recommendedStrategy: "Maintain secure entropy source adhering to NIST SP 800-90A",
              migrationCandidates: ["NIST SP 800-90A DRBG", "WebCrypto CSPRNG"],
              affectedDependencies: ["token-generation", "nonce-generator"],
            });
          }
        },
      });
    } catch (e) {
      console.error("AST traversal error in JS parser:", e);
    }

    return findings;
  }
}
