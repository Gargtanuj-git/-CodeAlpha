import React, { useEffect, useState } from "react";
import Spinner from "../components/Spinner";

const API = "http://localhost:8000";

export default function Settings({ settings, setSettings }) {
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nmapOutput, setNmapOutput] = useState("");
  const [nmapStatus, setNmapStatus] = useState("");

  useEffect(() => {
    const fetchInterfaces = async () => {
      try {
        const res = await fetch(`${API}/interfaces`);
        const data = await res.json();
        setInterfaces(data.interfaces || []);
      } catch (err) {
        setInterfaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterfaces();
  }, []);

  const runNmap = async () => {
    setNmapStatus("Running Nmap on localhost...");
    setNmapOutput("");
    try {
      const res = await fetch(`${API}/nmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "127.0.0.1" })
      });
      const data = await res.json();
      if (data.ok) {
        setNmapStatus("Nmap completed.");
        setNmapOutput(data.output || "No output");
      } else {
        setNmapStatus("Nmap failed.");
        setNmapOutput(data.error || "Unknown error");
      }
    } catch (err) {
      setNmapStatus("Nmap failed.");
      setNmapOutput("Backend unavailable or Nmap not installed.");
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="glass rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-white">Capture Settings</h2>
        <p className="mt-2 text-sm text-slate-400">
          Configure capture interface, stream cadence, and UI packet limits.
        </p>
        {loading && <div className="mt-4"><Spinner /></div>}
        {!loading && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Interface
              </label>
              <select
                value={settings.iface}
                onChange={(e) => setSettings({ ...settings, iface: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-700/60 bg-black/30 px-3 py-2 text-sm"
              >
                <option value="">Default</option>
                {interfaces.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Emit Interval (ms)
              </label>
              <input
                value={settings.emitIntervalMs}
                onChange={(e) => setSettings({ ...settings, emitIntervalMs: e.target.value })}
                placeholder="0 (no throttle)"
                className="mt-2 w-full rounded-xl border border-slate-700/60 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Max Packets (UI)
              </label>
              <input
                value={settings.maxPackets}
                onChange={(e) => setSettings({ ...settings, maxPackets: e.target.value })}
                placeholder="200"
                className="mt-2 w-full rounded-xl border border-slate-700/60 bg-black/30 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white">Local Nmap Scan</h3>
        <p className="mt-2 text-sm text-slate-400">
          Runs an Nmap scan against localhost only. Requires Nmap installed.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={runNmap}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black"
          >
            Run Nmap (127.0.0.1)
          </button>
          <span className="text-xs text-slate-500">
            Nmap output will appear below.
          </span>
        </div>
        {nmapStatus && (
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            {nmapStatus}
          </p>
        )}
        {nmapOutput && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-black/50 p-4 text-xs text-slate-300">
            {nmapOutput}
          </pre>
        )}
      </div>
    </div>
  );
}
