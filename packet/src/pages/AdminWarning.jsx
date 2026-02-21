import React from "react";

export default function AdminWarning() {
  return (
    <div className="glass fade-in rounded-2xl p-6">
      <h2 className="text-2xl font-semibold text-white">Admin Rights Required</h2>
      <p className="mt-3 text-slate-300">
        Packet capture on Windows requires Administrator privileges and the Npcap
        driver. Without elevated rights, Scapy cannot access network interfaces.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800/70 bg-black/40 p-4">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Steps</h3>
          <ol className="mt-3 list-decimal pl-4 text-sm text-slate-300">
            <li>Install Npcap from https://npcap.com</li>
            <li>Enable WinPcap compatibility during install</li>
            <li>Run PowerShell as Administrator</li>
            <li>Start backend: uvicorn backend.main:app --reload</li>
          </ol>
        </div>
        <div className="rounded-xl border border-slate-800/70 bg-black/40 p-4">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Legal</h3>
          <p className="mt-3 text-sm text-slate-300">
            Capture traffic only on networks you own or have explicit permission to
            monitor. Unauthorized packet capture may be illegal and violates
            privacy policies.
          </p>
        </div>
      </div>
    </div>
  );
}
