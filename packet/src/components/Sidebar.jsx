import React from "react";

const items = [
  { key: "dashboard", label: "Dashboard" },
  { key: "packets", label: "Packets" },
  { key: "threats", label: "Threats" },
  { key: "settings", label: "Settings" },
  { key: "warning", label: "Admin Warning" }
];

export default function Sidebar({ open, view, setView }) {
  return (
    <aside
      className={`glass fade-in hidden min-h-[calc(100vh-120px)] w-60 flex-col gap-3 rounded-2xl p-4 md:flex ${
        open ? "flex" : "hidden"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
        Navigation
      </p>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => setView(item.key)}
          className={`rounded-xl px-4 py-3 text-left text-sm transition ${
            view === item.key
              ? "bg-accent/10 text-accent shadow-glow"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          {item.label}
        </button>
      ))}
      <div className="mt-auto rounded-xl border border-slate-700/50 bg-black/40 p-3 text-xs text-slate-400">
        Capture status and filters are managed from the dashboard.
      </div>
    </aside>
  );
}
