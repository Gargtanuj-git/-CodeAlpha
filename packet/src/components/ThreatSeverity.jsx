import React, { useMemo } from "react";

export default function ThreatSeverity({ events }) {
  const { score, label, color } = useMemo(() => {
    const count = events.length;
    if (count >= 20) return { score: 90, label: "High", color: "text-danger" };
    if (count >= 8) return { score: 60, label: "Elevated", color: "text-warning" };
    if (count >= 3) return { score: 35, label: "Guarded", color: "text-accent" };
    return { score: 10, label: "Low", color: "text-slate-300" };
  }, [events]);

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Threat Severity</p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className={`text-3xl font-semibold ${color}`}>{score}%</p>
          <p className={`text-xs uppercase tracking-[0.3em] ${color}`}>{label}</p>
        </div>
        <div className="h-16 w-16 rounded-full border-2 border-slate-700/60 p-1">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-black/40 text-xs text-slate-400">
            {events.length} alerts
          </div>
        </div>
      </div>
    </div>
  );
}
