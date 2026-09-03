"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FolderGit2, ChevronDown, Check, Sparkles } from "lucide-react";

interface Repo {
  id: string;
  name: string;
  defaultBranch?: string;
  scans?: { postureScore: number }[];
}

export function RepositorySelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRepoId = searchParams.get("repoId");

  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const res = await fetch("/api/repositories");
      const data = await res.json();
      if (data.repositories && data.repositories.length > 0) {
        setRepos(data.repositories);
        // If query param repoId exists, use it; else check localStorage; else default to first
        const stored = typeof window !== "undefined" ? localStorage.getItem("qs_active_repo_id") : null;
        const active = currentRepoId || stored || data.repositories[0].id;
        setSelectedRepoId(active);
        if (!currentRepoId && active) {
          localStorage.setItem("qs_active_repo_id", active);
        }
      }
    } catch (e) {
      console.error("Failed to fetch repositories:", e);
    }
  };

  const handleSelect = (repo: Repo) => {
    setSelectedRepoId(repo.id);
    localStorage.setItem("qs_active_repo_id", repo.id);
    setIsOpen(false);

    // Build new query string preserving other params
    const params = new URLSearchParams(searchParams.toString());
    params.set("repoId", repo.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeRepo = repos.find((r) => r.id === (currentRepoId || selectedRepoId)) || repos[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-all shadow-sm"
      >
        <FolderGit2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span className="font-semibold text-white max-w-[160px] truncate">
          {activeRepo?.name || "Select Repository"}
        </span>
        {activeRepo?.scans?.[0]?.postureScore !== undefined && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-cyan-300 border border-indigo-800">
            {activeRepo.scans[0].postureScore}/100
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[#0e1424] border border-slate-700 shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>Target Repository</span>
            <Sparkles className="h-3 w-3 text-cyan-400" />
          </div>
          <div className="p-1 max-h-60 overflow-y-auto space-y-0.5">
            {repos.map((r) => {
              const isSelected = r.id === activeRepo?.id;
              const score = r.scans?.[0]?.postureScore;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                    isSelected
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-medium"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderGit2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                    <span className="truncate">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {score !== undefined && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {score}/100
                      </span>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-slate-800/80 bg-slate-900/40">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/repositories");
              }}
              className="w-full text-center text-[11px] font-medium text-indigo-400 hover:text-indigo-300 py-1"
            >
              + Connect New Repository
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
