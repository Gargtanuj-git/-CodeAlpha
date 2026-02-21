import React from "react";

export default function Filters({ filters, setFilters, onStart, onStop, onExport, onExportJson, onExportCsv, capturing }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Protocol
          </label>
          <select
            value={filters.protocol}
            onChange={(e) => setFilters({ ...filters, protocol: e.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-700/60 bg-black/30 px-3 py-2 text-sm"
          >
            <option value="ALL">All</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
            IP Filter
          </label>
          <input
            value={filters.ip}
            onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
            placeholder="192.168.1.10"
            className="mt-2 w-full rounded-xl border border-slate-700/60 bg-black/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Port Filter
          </label>
          <input
            value={filters.port}
            onChange={(e) => setFilters({ ...filters, port: e.target.value })}
            placeholder="443"
            className="mt-2 w-full rounded-xl border border-slate-700/60 bg-black/30 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={onStart}
            disabled={capturing}
            className="w-full rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            Start
          </button>
          <button
            onClick={onStop}
            disabled={!capturing}
            className="w-full rounded-xl border border-slate-700/60 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
          >
            Stop
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onExport}
          className="rounded-xl border border-slate-700/60 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-300 hover:border-accent"
        >
          Export PCAP
        </button>
        <button
          onClick={onExportJson}
          className="rounded-xl border border-slate-700/60 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-300 hover:border-accent"
        >
          Export JSON
        </button>
        <button
          onClick={onExportCsv}
          className="rounded-xl border border-slate-700/60 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-300 hover:border-accent"
        >
          Export CSV
        </button>
        <span className="text-xs text-slate-500">
          Tip: Apply filters to reduce noise and improve clarity.
        </span>
      </div>
    </div>
  );
}
