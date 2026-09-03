"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GitFork,
  Cpu,
  FileCode,
  Lock,
  Layers,
  ShieldAlert,
  ArrowRight,
  Search,
  Filter,
  Info,
} from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: string;
  metadata?: any;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  relation: string;
  confidence: number;
}

interface DependencyGraphViewerProps {
  nodes: Node[];
  edges: Edge[];
}

export function DependencyGraphViewer({
  nodes,
  edges,
}: DependencyGraphViewerProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(nodes[0] || null);
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredNodes = nodes.filter((n) => {
    const matchesSearch =
      n.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      n.type.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === "ALL" || n.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group nodes by type for visual hierarchy
  const serviceNodes = nodes.filter((n) => n.type === "SERVICE");
  const fileNodes = nodes.filter((n) => n.type === "FILE");
  const libNodes = nodes.filter((n) => n.type === "CRYPTO_LIBRARY");
  const algoNodes = nodes.filter((n) => n.type === "ALGORITHM");

  const getNodeColor = (type: string) => {
    switch (type) {
      case "SERVICE":
        return "bg-indigo-950 border-indigo-600 text-indigo-200";
      case "FILE":
        return "bg-slate-900 border-slate-700 text-slate-300";
      case "CRYPTO_LIBRARY":
        return "bg-purple-950 border-purple-600 text-purple-200";
      case "ALGORITHM":
        return "bg-red-950/70 border-red-600 text-red-200";
      default:
        return "bg-slate-800 border-slate-700 text-slate-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {["ALL", "SERVICE", "FILE", "CRYPTO_LIBRARY", "ALGORITHM"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                  typeFilter === t
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Nodes: <strong className="text-slate-200">{nodes.length}</strong> | Edges:{" "}
          <strong className="text-slate-200">{edges.length}</strong>
        </div>
      </div>

      {/* Main Graph Grid: Interactive Hierarchy + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Call Graph Canvas */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-[#060a12] p-6 min-h-[520px] flex flex-col justify-between overflow-x-auto relative">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6 flex items-center justify-between">
            <span>Cryptographic Relationship Hierarchy</span>
            <span className="text-[10px] font-mono text-indigo-400">
              Service → File → Library → Algorithm
            </span>
          </div>

          {/* Hierarchical Column Flow */}
          <div className="grid grid-cols-4 gap-4 items-start flex-1">
            {/* Column 1: Services */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">
                Services (1)
              </div>
              {serviceNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedNode?.id === node.id
                      ? "ring-2 ring-indigo-500 bg-indigo-950/80 border-indigo-500"
                      : getNodeColor(node.type)
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{node.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Root Boundary</div>
                </div>
              ))}
            </div>

            {/* Column 2: Files */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                Source Files ({fileNodes.length})
              </div>
              {fileNodes.slice(0, 5).map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedNode?.id === node.id
                      ? "ring-2 ring-indigo-500 bg-slate-800 border-indigo-400"
                      : getNodeColor(node.type)
                  }`}
                >
                  <div className="font-mono text-[11px] font-semibold flex items-center gap-1.5 truncate">
                    <FileCode className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{node.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3: Libraries */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase text-purple-400 font-bold tracking-wider">
                Crypto Libraries ({libNodes.length})
              </div>
              {libNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedNode?.id === node.id
                      ? "ring-2 ring-purple-500 bg-purple-950 border-purple-400"
                      : getNodeColor(node.type)
                  }`}
                >
                  <div className="font-mono text-[11px] font-semibold flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-purple-400 shrink-0" />
                    <span>{node.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 4: Algorithms */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase text-red-400 font-bold tracking-wider">
                Algorithms ({algoNodes.length})
              </div>
              {algoNodes.slice(0, 5).map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedNode?.id === node.id
                      ? "ring-2 ring-red-500 bg-red-950 border-red-400"
                      : getNodeColor(node.type)
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold flex items-center gap-1.5 truncate">
                    <ShieldAlert className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="truncate">{node.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Graph Inferences: Verifiable dependency edges generated via static AST analysis</span>
            <span className="text-cyan-400 font-mono">Zero Fabricated Links</span>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#0d1322] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Info className="h-4 w-4 text-cyan-400" />
              <span>Node Inspector</span>
            </h3>
            {selectedNode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {selectedNode.type}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">Node Label</div>
                <div className="text-base font-bold text-white font-mono mt-1">
                  {selectedNode.label}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">Node ID</div>
                <div className="text-xs font-mono text-slate-400 break-all bg-slate-900/60 p-2 rounded border border-slate-800 mt-1">
                  {selectedNode.id}
                </div>
              </div>

              {selectedNode.metadata && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-medium">Extracted Metadata</div>
                  <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-cyan-300 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.type === "ALGORITHM" && (
                <div className="pt-3 border-t border-slate-800">
                  <Link
                    href="/findings"
                    className="w-full py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>Remediate in Findings View</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Click any node in the graph to inspect its parameters, relationships, and risk score.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
