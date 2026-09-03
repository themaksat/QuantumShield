"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  GitBranch,
  RefreshCw,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";

interface RepoItem {
  id: string;
  name: string;
  url: string | null;
  defaultBranch: string;
  localPath: string | null;
  scans: Array<{
    id: string;
    totalAssets: number;
    vulnerableCount: number;
    postureScore: number;
    createdAt: string;
  }>;
  _count: {
    cryptoAssets: number;
    findings: number;
  };
}

interface RepositoryManagerProps {
  projectId: string;
  initialRepositories: RepoItem[];
}

export function RepositoryManager({
  projectId,
  initialRepositories,
}: RepositoryManagerProps) {
  const router = useRouter();
  const [repositories, setRepositories] = useState<RepoItem[]>(initialRepositories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"demo" | "local" | "github">("demo");
  const [localPathInput, setLocalPathInput] = useState("");
  const [githubUrlInput, setGithubUrlInput] = useState("");
  const [repoNameInput, setRepoNameInput] = useState("");
  const [branchInput, setBranchInput] = useState("");
  const [scanningRepoId, setScanningRepoId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Trigger scan for a specific repository
  const handleScanRepository = async (repoId: string) => {
    try {
      setScanningRepoId(repoId);
      setStatusMessage("Scanning repository with AST static analysis...");
      const res = await fetch(`/api/projects/${projectId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setStatusMessage(
        `Scan completed: Discovered ${data.metrics?.totalAssets} assets (${data.metrics?.quantumVulnerable} quantum vulnerable). Posture Score: ${data.postureScore}/100.`
      );
      router.refresh();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (e: any) {
      setStatusMessage(`Scan failed: ${e.message}`);
    } finally {
      setScanningRepoId(null);
    }
  };

  // Delete a repository
  const handleDeleteRepository = async (repoId: string, repoName: string) => {
    if (!confirm(`Are you sure you want to remove repository "${repoName}"?`)) return;
    try {
      const res = await fetch(`/api/repositories?id=${repoId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete repository");
      setStatusMessage(`Repository "${repoName}" removed successfully.`);
      router.refresh();
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  // Connect new repository
  const handleConnectRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (activeTab === "github") {
        if (!githubUrlInput) throw new Error("Please specify a GitHub repository URL or owner/repo");
        setStatusMessage(`Cloning public repository ${githubUrlInput} from GitHub...`);
        const res = await fetch("/api/repositories/github-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoUrl: githubUrlInput.trim(),
            branch: branchInput && branchInput.trim() !== "" ? branchInput.trim() : undefined,
            name: repoNameInput && repoNameInput.trim() !== "" ? repoNameInput.trim() : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to clone GitHub repository");

        setIsModalOpen(false);
        setStatusMessage(
          `Cloned & Ingested "${data.repository.name}"! Discovered ${data.metrics?.totalAssets || 0} crypto assets (${data.metrics?.quantumVulnerable || 0} quantum vulnerable). Posture Score: ${data.postureScore}/100.`
        );
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        return;
      }

      let name = repoNameInput;
      let url = null;
      let localPath = null;

      if (activeTab === "demo") {
        name = "enterprise-payments-core";
        url = "https://github.com/acme-payments/enterprise-payments-core";
      } else if (activeTab === "local") {
        if (!localPathInput) throw new Error("Please specify a local folder path");
        localPath = localPathInput;
        if (!name) name = localPathInput.split(/[\\/]/).pop() || "local-repo";
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: name,
          repoUrl: url,
          localPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register repository");

      setIsModalOpen(false);
      setStatusMessage(`Repository "${name}" registered successfully. Starting initial scan...`);
      router.refresh();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-mono">
            {repositories.length} Active Connected Repositories
          </span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-medium text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Connect Repository</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-xs text-cyan-300 flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Repositories Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {repositories.map((repo) => {
          const latestScan = repo.scans[0];
          const isScanning = scanningRepoId === repo.id;

          return (
            <div
              key={repo.id}
              className="rounded-xl border border-slate-800 bg-[#0d1322] p-6 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <FolderGit2 className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{repo.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                          Active Monitor
                        </span>
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-slate-500" />
                          <span>{repo.defaultBranch}</span>
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-md">{repo.localPath || repo.url}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-right min-w-[80px]">
                    <div className="text-[11px] text-slate-400 font-medium">Crypto Assets</div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {latestScan?.totalAssets ?? repo._count.cryptoAssets}
                    </div>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <div className="text-[11px] text-slate-400 font-medium">Quantum Vulns</div>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                      {latestScan?.vulnerableCount ?? repo._count.findings}
                    </div>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <div className="text-[11px] text-slate-400 font-medium">Posture Score</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                      {latestScan?.postureScore ?? 68}/100
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleScanRepository(repo.id)}
                      disabled={isScanning}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin text-cyan-400" : ""}`} />
                      <span>{isScanning ? "Scanning..." : "Scan Now"}</span>
                    </button>

                    <Link
                      href={`/?repoId=${repo.id}`}
                      className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-slate-700 transition-all"
                    >
                      Dashboard
                    </Link>

                    <Link
                      href={`/inventory?repoId=${repo.id}`}
                      className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
                    >
                      View CBOM
                    </Link>

                    <Link
                      href={`/findings?repoId=${repo.id}`}
                      className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm transition-all"
                    >
                      Remediate
                    </Link>

                    {repo.name !== "enterprise-payments-core" && (
                      <button
                        onClick={() => handleDeleteRepository(repo.id, repo.name)}
                        title="Remove repository"
                        className="p-1.5 rounded bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Repository Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-indigo-400" />
                <span>Connect Source Code Repository</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab selection */}
            <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab("demo")}
                className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === "demo"
                    ? "border-indigo-500 text-white bg-indigo-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Bundled Demo</span>
              </button>
              <button
                onClick={() => setActiveTab("local")}
                className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === "local"
                    ? "border-indigo-500 text-white bg-indigo-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Local Path</span>
              </button>
              <button
                onClick={() => setActiveTab("github")}
                className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === "github"
                    ? "border-indigo-500 text-white bg-indigo-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <GitBranch className="h-3.5 w-3.5 text-slate-300" />
                <span>GitHub URL</span>
              </button>
            </div>

            <form onSubmit={handleConnectRepository} className="p-6 space-y-4">
              {activeTab === "demo" && (
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-white">Vulnerable Financial Settlement Demo</div>
                  <p className="text-slate-400 leading-relaxed">
                    Instantly load the pre-packaged enterprise payments service containing authentic RSA-2048 signing, ECDH key agreement, JWT RS256, legacy TLS 1.2, and SHA-1 hashing across TypeScript, Python, and Go.
                  </p>
                </div>
              )}

              {activeTab === "local" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Local Filesystem Directory
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. C:\Users\Username\Projects\my-service"
                      value={localPathInput}
                      onChange={(e) => setLocalPathInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Repository Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. my-crypto-service"
                      value={repoNameInput}
                      onChange={(e) => setRepoNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {activeTab === "github" && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-[11px] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Public repositories are cloned automatically without requiring any token or authentication.</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      GitHub Repository URL or owner/repo
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. octocat/Hello-World or https://github.com/owner/repo"
                      value={githubUrlInput}
                      onChange={(e) => setGithubUrlInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Presets */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                      Quick Public Presets:
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setGithubUrlInput("octocat/Hello-World");
                          setBranchInput("");
                          setRepoNameInput("Hello-World");
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all font-mono"
                      >
                        octocat/Hello-World
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGithubUrlInput("open-quantum-safe/liboqs");
                          setBranchInput("");
                          setRepoNameInput("liboqs");
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all font-mono"
                      >
                        open-quantum-safe/liboqs
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGithubUrlInput("google/boringssl");
                          setBranchInput("");
                          setRepoNameInput("boringssl");
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all font-mono"
                      >
                        google/boringssl
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Branch (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Default branch"
                        value={branchInput}
                        onChange={(e) => setBranchInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Repository Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Auto-detected"
                        value={repoNameInput}
                        onChange={(e) => setRepoNameInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? "Connecting..." : "Connect & Ingest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
