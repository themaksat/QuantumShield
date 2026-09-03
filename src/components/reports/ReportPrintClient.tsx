"use client";

import React from "react";
import { Printer, Download, FileSpreadsheet } from "lucide-react";

interface ReportPrintClientProps {
  projectId: string;
}

export function ReportPrintClient({ projectId }: ReportPrintClientProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrint}
        className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
      >
        <Printer className="h-4 w-4 text-cyan-400" />
        <span>Print / Save PDF</span>
      </button>

      <a
        href={`/api/projects/${projectId}/cbom/export?format=csv`}
        download
        className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
      >
        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
        <span>Export CSV</span>
      </a>

      <a
        href={`/api/projects/${projectId}/cbom/export?format=json`}
        target="_blank"
        rel="noreferrer"
        className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
      >
        <Download className="h-4 w-4" />
        <span>Export CBOM JSON</span>
      </a>
    </div>
  );
}
