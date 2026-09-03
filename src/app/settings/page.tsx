import React from "react";
import { SettingsManagerClient } from "@/components/settings/SettingsManagerClient";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Integrations</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure GitHub App credentials, post-quantum cryptography providers, and automated scanning schedules.
        </p>
      </div>

      <SettingsManagerClient />
    </div>
  );
}
