import { db } from "../db";
import { CryptoFindingRaw } from "../scanner/types";

export interface PolicyViolation {
  policyName: string;
  ruleId: string;
  severity: "DENY" | "WARN";
  message: string;
  findingTitle: string;
  file: string;
  line: number;
}

export class PolicyEngine {
  public static readonly DEFAULT_POLICIES = [
    {
      id: "policy-no-hardcoded-keys",
      name: "Prohibit Hardcoded Cryptographic Material",
      description: "Hardcoded private keys, certificates, and secrets are strictly forbidden.",
      rules: JSON.stringify([
        { condition: "assetType == 'key_storage' || title.includes('Hardcoded')", action: "DENY", message: "Hardcoded private key found in repository." },
      ]),
      enabled: true,
    },
    {
      id: "policy-deprecate-weak-hashes",
      name: "Deprecate Weak Collision-Vulnerable Hash Functions",
      description: "Prohibit SHA-1 and MD5 in signature and integrity operations under NIST SP 800-131A.",
      rules: JSON.stringify([
        { condition: "algorithm == 'SHA-1' || algorithm == 'MD5'", action: "WARN", message: "Use of broken hash algorithm prohibited." },
      ]),
      enabled: true,
    },
    {
      id: "policy-rsa-sunset-2030",
      name: "NIST Post-Quantum Cryptography Migration Policy",
      description: "Require migration plans and crypto-agility abstractions for all classical asymmetric keys (RSA, ECC, ECDH).",
      rules: JSON.stringify([
        { condition: "quantumVulnerable == true", action: "WARN", message: "Classical asymmetric primitive must have active PQC transition plan." },
      ]),
      enabled: true,
    },
  ];

  public static async evaluateFindings(findings: CryptoFindingRaw[]): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    for (const f of findings) {
      if (f.assetType === "key_storage" || f.title.includes("Hardcoded")) {
        violations.push({
          policyName: "Prohibit Hardcoded Cryptographic Material",
          ruleId: "deny-hardcoded-keys",
          severity: "DENY",
          message: `Violation: Hardcoded private key detected in ${f.file}:${f.lineStart}`,
          findingTitle: f.title,
          file: f.file,
          line: f.lineStart,
        });
      }

      if (f.algorithm === "SHA-1" || f.algorithm === "MD5") {
        violations.push({
          policyName: "Deprecate Weak Collision-Vulnerable Hash Functions",
          ruleId: "warn-weak-hash",
          severity: "WARN",
          message: `Warning: Deprecated hash ${f.algorithm} in ${f.file}:${f.lineStart}`,
          findingTitle: f.title,
          file: f.file,
          line: f.lineStart,
        });
      }

      if (f.quantumVulnerable) {
        violations.push({
          policyName: "NIST Post-Quantum Cryptography Migration Policy",
          ruleId: "warn-quantum-vulnerable",
          severity: "WARN",
          message: `PQC Policy Advisory: ${f.algorithm} requires migration to FIPS 203/204/205 standard.`,
          findingTitle: f.title,
          file: f.file,
          line: f.lineStart,
        });
      }
    }

    return violations;
  }
}
