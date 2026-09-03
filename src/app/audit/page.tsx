import React from "react";
import { db } from "@/lib/db";
import { AuditLogClient } from "@/components/audit/AuditLogClient";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await db.auditEvent.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  const formattedEvents = events.map((e) => ({
    id: e.id,
    actor: e.actor,
    action: e.action,
    objectType: e.objectType,
    objectId: e.objectId,
    timestamp: e.timestamp.toISOString(),
    metadata: e.metadata ? JSON.parse(e.metadata) : {},
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Immutable Cryptographic Audit Trail
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
            Append-Only Ledger
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Complete compliance evidence log tracking every scan, discovery, patch synthesis, validation, and PR creation.
        </p>
      </div>

      <AuditLogClient events={formattedEvents} />
    </div>
  );
}
