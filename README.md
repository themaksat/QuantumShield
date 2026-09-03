# QuantumShield 🛡️⚛️

[![CI Status](https://github.com/themaksat/QuantumShield/actions/workflows/ci.yml/badge.svg)](https://github.com/themaksat/QuantumShield/actions/workflows/ci.yml)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.18-2D3748?logo=prisma)](https://www.prisma.io/)
[![NIST FIPS 203/204/205](https://img.shields.io/badge/NIST-FIPS%20203%20%7C%20204%20%7C%20205-emerald)](https://csrc.nist.gov/pqc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Enterprise Platform for Cryptographic Asset Discovery, Post-Quantum Migration Planning, Automated Remediation, and Continuous Cryptographic Governance.**

QuantumShield connects to software repositories, automatically discovers cryptographic primitives via AST static analysis, constructs a CycloneDX 1.6 Cryptographic Bill of Materials (CBOM), builds cryptographic dependency graphs, calculates an explainable 0–100 quantum risk score, generates post-quantum migration plans (NIST FIPS 203/204/205), synthesizes safe code patches, runs multi-stage sandboxed validation, opens reviewable Git Pull Requests, and applies verified fixes directly into production codebases.

---

## 🚀 Key Features

- 🔍 **Multi-Language AST Discovery**: Deep cryptographic static analysis supporting TypeScript/JavaScript, Python, Go, and Java. Detects asymmetric algorithms, key lengths, cipher modes, hardcoded secrets, and Web Crypto APIs.
- 📦 **CycloneDX 1.6 CBOM**: Generates standard Cryptographic Bill of Materials with live JSON export, CSV export, keyword filtering, and version comparison diffs.
- ⚖️ **Explainable Risk Engine (0–100)**: Multi-factor risk scoring evaluating Shor's algorithm vulnerability, classical key margins, non-repudiation longevity, and credential exposure.
- 🗺️ **Deterministic PQC Migration Recipes**: Pre-engineered recipes migrating classical algorithms (RSA, ECDSA, ECDH) to standardized post-quantum schemes:
  - **FIPS 203**: ML-KEM (Module-Lattice Key Encapsulation)
  - **FIPS 204**: ML-DSA (Module-Lattice Digital Signatures)
  - **FIPS 205**: SLH-DSA (Stateless Hash-Based Digital Signatures)
  - **Hybrid Agility Layers**: Dual-signing and hybrid key exchange abstractions (`X25519MLKEM768`).
- 🛠️ **Automated Code Patching & Companion Modules**: Synthesizes drop-in unified diffs alongside language-specific provider abstractions (`CryptoProvider.ts`, `AgileTokenSigner.ts`, Go/Java/Python modules) and test fixtures.
- 🧪 **5-Stage Sandbox Validation**: Automated verification evaluating syntax integrity, credential leak checks, cryptographic policy compliance, protocol compatibility, and latency profiling.
- ⚡ **Direct Codebase Application**: 1-click **Apply Fix to Codebase** writes remediations directly to repository files and triggers live posture score recalculation.
- 🌐 **Public GitHub Repository Ingestion**: Instantly clones public repositories with depth-1 checkout (no PAT or login required), extracts commit SHAs, and executes cryptographic discovery.
- 🕸️ **Interactive Cryptographic Dependency Graph**: SVG visualization connecting Services &rarr; Files &rarr; Libraries &rarr; Algorithms with detail inspect drawers.
- 📜 **Policy Governance & Compliance Audit**: Configurable NIST FIPS guardrails with tamper-evident audit logs exportable to CSV.

---

## 🏛️ System Architecture

```
[Target Codebase / GitHub Repo]
           │
           ▼
[AST Static Analysis Parsers] ─── (TS, Python, Go, Java, WebCrypto)
           │
           ├─► [CycloneDX 1.6 CBOM Engine] ────► JSON & CSV Export / Diffs
           ├─► [Dependency Graph Generator] ───► SVG Interactive Visualizer
           └─► [Explainable Risk Engine] ──────► 0–100 Posture Score
                       │
                       ▼
           [PQC Migration Planner] ───────────► NIST FIPS 203/204/205 Recipes
                       │
                       ▼
           [Safe Code Patch Synthesizer] ─────► Diffs + Companion Providers
                       │
                       ▼
           [5-Stage Sandbox Validator] ───────► Syntax, Leak, Policy, Latency
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
    [Git Pull Request]   [Direct Apply to Codebase]
                                   │
                                   ▼
                       [Dynamic Posture Update]
```

---

## ⚡ Quickstart

### Option 1: Run Locally with Node.js

#### Prerequisites
- Node.js 20+
- Git 2.40+

```bash
# 1. Clone repository
git clone https://github.com/themaksat/QuantumShield.git
cd QuantumShield

# 2. Install dependencies
npm install

# 3. Initialize database
npx prisma db push

# 4. Run automated test suite
npm test

# 5. Start development server
npm run dev
# Or build and run production server:
npm run build
npm start
```

Visit **`http://localhost:3000`** in your browser.

---

### Option 2: Run with Docker Compose

```bash
# Clone and start with one command
git clone https://github.com/themaksat/QuantumShield.git
cd QuantumShield
docker compose up -d --build
```

The application will be live at `http://localhost:3000`.

---

## 🔄 CI/CD Automation

QuantumShield includes a production GitHub Actions CI/CD setup:

- **`.github/workflows/ci.yml`**:
  - Automatically runs on all pushes and pull requests to `main` and `master`.
  - Executes TypeScript typechecking (`tsc --noEmit`).
  - Runs cryptographic engine tests (`npm test`).
  - Compiles the Next.js production build (`npm run build`).
  - Runs the full 30-point system verification audit script.
- **`.github/workflows/cd.yml`**:
  - Automatically builds and publishes multi-platform Docker container images to GitHub Container Registry (`ghcr.io/themaksat/quantumshield`).

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | List all projects, repositories, and scan metrics |
| `POST` | `/api/projects` | Register a new project or repository |
| `POST` | `/api/projects/:id/scan` | Trigger AST static analysis scan on repository |
| `GET` | `/api/projects/:id/cbom` | Retrieve CycloneDX 1.6 Cryptographic Bill of Materials |
| `GET` | `/api/projects/:id/cbom/export` | Export CBOM in JSON or CSV format (`?format=csv`) |
| `GET` | `/api/projects/:id/cbom/diff` | Compare CBOM version differences across scans |
| `GET` | `/api/projects/:id/dependency-graph` | Fetch graph nodes & edges linking files, libraries, and algorithms |
| `GET` | `/api/findings/:id` | Get finding details, risk breakdown, and code snippets |
| `POST` | `/api/findings/:id/migration-plan` | Generate deterministic NIST PQC migration plan |
| `POST` | `/api/migrations/:id/generate-patch` | Generate safe code patch and companion provider files |
| `POST` | `/api/patches/:id/validate` | Run 5-stage sandboxed validation suite |
| `POST` | `/api/patches/:id/create-pr` | Create Git branch and open Pull Request |
| `POST` | `/api/patches/:id/apply` | Merge patch directly to repository files & update posture score |
| `GET` | `/api/repositories` | List all connected repositories |
| `DELETE` | `/api/repositories?id=:id` | Remove a connected repository and clean local workspace |
| `POST` | `/api/repositories/github-import` | Clone and ingest public GitHub repo (`owner/repo` or URL) |
| `GET` | `/api/policies` | List active cryptographic governance policies and violations |

---

## 🛡️ NIST Post-Quantum Standards Mapping

| Standard | Algorithm | Function | Status in QuantumShield |
| :--- | :--- | :--- | :--- |
| **FIPS 203** | ML-KEM-512 / 768 / 1024 | General Key Encapsulation (KEM) | Native Migration Target |
| **FIPS 204** | ML-DSA-44 / 65 / 87 | Primary Digital Signatures | Native Migration Target |
| **FIPS 205** | SLH-DSA (SPHINCS+) | Stateless Hash Signatures | Non-Lattice High-Assurance Target |
| **Hybrid Drafts** | X25519MLKEM768 | Hybrid Key Exchange | Supported for TLS & Microservices |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
