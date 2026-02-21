import React, { useState } from "react";
import LiveIndicator from "../components/LiveIndicator";
import Filters from "../components/Filters";
import PacketTable from "../components/PacketTable";
import Spinner from "../components/Spinner";
import usePacketStream from "../hooks/usePacketStream";

export default function Packets({ settings }) {
  const [filters, setFilters] = useState({ protocol: "ALL", ip: "", port: "" });
  const {
    packets,
    capturing,
    loading,
    error,
    lastPacketId,
    startCapture,
    stopCapture,
    exportPcap
  } = usePacketStream({ maxPackets: settings?.maxPackets });

  const exportJson = async () => {
    const res = await fetch("http://localhost:8000/export/json", { method: "POST" });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.packets || [], null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "packets.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async () => {
    const res = await fetch("http://localhost:8000/export/csv", { method: "POST" });
    const data = await res.json();
    const blob = new Blob([data.csv || ""], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "packets.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Packet Feed</p>
          <h2 className="text-2xl font-semibold text-white">Live Packets</h2>
        </div>
        <LiveIndicator active={capturing} />
      </div>

      {error && (
        <div className="glass rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && <Spinner />}

      <Filters
        filters={filters}
        setFilters={setFilters}
        onStart={() => startCapture(filters, settings)}
        onStop={stopCapture}
        onExport={exportPcap}
        onExportJson={exportJson}
        onExportCsv={exportCsv}
        capturing={capturing}
      />

      <PacketTable packets={packets} lastPacketId={lastPacketId} />
    </div>
  );
}
