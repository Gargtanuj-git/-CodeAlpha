import React, { useMemo } from "react";
import usePacketStream from "../hooks/usePacketStream";
import Spinner from "../components/Spinner";
import ThreatSeverity from "../components/ThreatSeverity";

export default function Threats() {
  const { suspicious, capturing, loading, error } = usePacketStream();

  const items = useMemo(() => {
    return [...suspicious].reverse().slice(0, 200);
  }, [suspicious]);

  return (
    <div className="space-y-6 fade-in">
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Threat Monitor</p>
          <h2 className="text-2xl font-semibold text-white">Suspicious Events</h2>
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {capturing ? "Live Capture" : "Idle"}
        </div>
      </div>

      {error && (
        <div className="glass rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && <Spinner />}

      <div className="grid gap-4 lg:grid-cols-3">
        <ThreatSeverity events={items} />
        <div className="glass rounded-2xl p-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Threat Summary
          </p>
          <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800/70 bg-black/40 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alerts</p>
              <p className="mt-2 text-lg text-white">{items.length}</p>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-black/40 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active</p>
              <p className="mt-2 text-lg text-white">{capturing ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-black/40 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Heuristic</p>
              <p className="mt-2 text-lg text-white">SYN Flood</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Recent Alerts
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-2 py-3">Time</th>
                <th className="px-2 py-3">Source IP</th>
                <th className="px-2 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {items.map((event, idx) => (
                <tr key={`${event.timestamp}-${idx}`} className="border-t border-slate-800/70">
                  <td className="px-2 py-3 text-xs text-slate-400">{event.timestamp}</td>
                  <td className="px-2 py-3 text-danger">{event.source_ip}</td>
                  <td className="px-2 py-3 text-slate-200">{event.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="mt-4 text-xs text-slate-500">No suspicious events detected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
