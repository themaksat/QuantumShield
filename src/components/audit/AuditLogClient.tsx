"use client";

import React, { useState } from "react";
import { ScrollText, Search, Filter, Download, FileSpreadsheet } from "lucide-react";

export interface AuditEventItem {
  id: string;
  actor: string;
  action: string;
  objectType: string;
  objectId: string;
  timestamp: string;
  metadata: any;
}

interface AuditLogClientProps {
  events: AuditEventItem[];
}

export function AuditLogClient({ events }: AuditLogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = events.filter((e) => {
    const matchesSearch =
      e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.objectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.objectId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "ALL" || e.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const actions = Array.from(new Set(events.map((e) => e.action)));

  const handleExportCsv = () => {
    const headers = ["ID", "Timestamp", "Actor", "Action", "ObjectType", "ObjectID", "Metadata"];
    const rows = filtered.map((e) => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.actor}"`,
      `"${e.action}"`,
      `"${e.objectType}"`,
      `"${e.objectId}"`,
      `"${JSON.stringify(e.metadata || {}).replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `quantumshield-audit-trail-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px]">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search actor, action, object..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Actions</option>
            {actions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Audit CSV</span>
          </button>
          <div className="text-xs font-mono text-slate-400">
            Showing <strong className="text-slate-200">{filtered.length}</strong> of {events.length}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recorded Audit Evidence Ledger
          </div>
          <div className="text-xs text-slate-500 font-mono">SOC2 / ISO 27001 Compliant</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Evidence Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((event) => (
                <tr key={event.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {event.timestamp.replace("T", " ").substring(0, 19)}
                  </td>
                  <td className="py-3.5 px-4 text-indigo-400 font-semibold">
                    {event.actor}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        event.action.includes("PR")
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : event.action.includes("PATCH")
                          ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                          : event.action.includes("SCAN")
                          ? "bg-indigo-950 text-indigo-400 border border-indigo-800"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {event.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="text-slate-500">{event.objectType}: </span>
                    <span className="text-slate-300">{event.objectId.substring(0, 12)}...</span>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400 truncate max-w-xs">
                    {JSON.stringify(event.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
