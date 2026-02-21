import React, { useMemo, useState } from "react";
import LiveIndicator from "../components/LiveIndicator";
import StatCard from "../components/StatCard";
import Filters from "../components/Filters";
import PacketTable from "../components/PacketTable";
import Spinner from "../components/Spinner";
import ProtocolPie from "../charts/ProtocolPie";
import PacketLine from "../charts/PacketLine";
import TopSourcesBar from "../charts/TopSourcesBar";
import TopPortsBar from "../charts/TopPortsBar";
import usePacketStream from "../hooks/usePacketStream";

export default function Dashboard({ settings }) {
  const [filters, setFilters] = useState({ protocol: "ALL", ip: "", port: "" });
  const {
    packets,
    stats,
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

  const protocolData = useMemo(() => {
    if (!stats?.protocols) return [];
    return Object.entries(stats.protocols).map(([name, value]) => ({ name, value }));
  }, [stats]);

  const timeSeries = useMemo(() => {
    if (!stats?.time_series) return [];
    return stats.time_series.map((point) => ({
      time: new Date(point.t * 1000).toLocaleTimeString(),
      count: point.count
    }));
  }, [stats]);

  const topSources = useMemo(() => {
    if (!stats?.top_sources) return [];
    return stats.top_sources.map(([name, value]) => ({ name, value }));
  }, [stats]);

  const topPorts = useMemo(() => {
    if (!stats?.top_dest_ports) return [];
    return stats.top_dest_ports.map(([name, value]) => ({ name, value }));
  }, [stats]);

  return (
    <div className="space-y-6 fade-in">
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live Capture</p>
          <h2 className="text-2xl font-semibold text-white">Real-Time Packet Stream</h2>
        </div>
        <LiveIndicator active={capturing} />
      </div>

      {error && (
        <div className="glass rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && <Spinner />}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Packets" value={stats?.total || 0} accent="text-accent" />
        <StatCard label="Suspicious" value={stats?.suspicious_count || 0} accent="text-danger" />
        <StatCard label="Top Sources" value={stats?.top_sources?.length || 0} />
        <StatCard label="Top Dest Ports" value={stats?.top_dest_ports?.length || 0} />
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <ProtocolPie data={protocolData} />
        <PacketLine data={timeSeries} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopSourcesBar data={topSources} title="Top Source IPs" />
        <TopPortsBar data={topPorts} title="Top Destination Ports" />
      </div>

      <PacketTable packets={packets} lastPacketId={lastPacketId} />
    </div>
  );
}
