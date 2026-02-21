import { useEffect, useRef, useState } from "react";

const API = "http://localhost:8000";
const WS = "ws://localhost:8000/ws";

export default function usePacketStream(options = {}) {
  const maxPackets = Number(options.maxPackets || 200);
  const [packets, setPackets] = useState([]);
  const [stats, setStats] = useState(null);
  const [suspicious, setSuspicious] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastPacketId, setLastPacketId] = useState(null);
  const packetIdRef = useRef(1);

  useEffect(() => {
    let ws;
    let pingInterval;

    const connect = () => {
      ws = new WebSocket(WS);
      ws.onopen = () => {
        ws.send("ready");
        pingInterval = setInterval(() => ws.send("ping"), 30000);
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "packet") {
            const id = packetIdRef.current++;
            const packet = { id, ...message.data };
            setLastPacketId(id);
            setPackets((prev) => [packet, ...prev].slice(0, maxPackets));
          }
        } catch (err) {
          setError("WebSocket parse error");
        }
      };
      ws.onclose = () => {
        clearInterval(pingInterval);
        setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        setError("WebSocket connection error");
      };
    };

    connect();

    return () => {
      clearInterval(pingInterval);
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, packetsRes, statusRes, suspiciousRes] = await Promise.all([
          fetch(`${API}/stats`),
          fetch(`${API}/packets?limit=${maxPackets}`),
          fetch(`${API}/status`),
          fetch(`${API}/suspicious`)
        ]);
        const statsData = await statsRes.json();
        const packetsData = await packetsRes.json();
        const statusData = await statusRes.json();
        const suspiciousData = await suspiciousRes.json();
        setStats(statsData);
        setPackets(
          (packetsData.packets || []).map((pkt) => ({
            id: packetIdRef.current++,
            ...pkt
          }))
        );
        setSuspicious(suspiciousData.events || []);
        setCapturing(statusData.status === "running");
        setError("");
        setLoading(false);
      } catch (err) {
        setError("Backend unavailable. Start FastAPI on port 8000.");
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const startCapture = async (filters, settings = {}) => {
    const payload = {
      protocol: filters.protocol === "ALL" ? null : filters.protocol,
      ip: filters.ip || null,
      port: filters.port ? parseInt(filters.port, 10) : null,
      iface: settings.iface || null,
      emit_interval_ms: settings.emitIntervalMs
        ? parseInt(settings.emitIntervalMs, 10)
        : null
    };
    await fetch(`${API}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setCapturing(true);
  };

  const stopCapture = async () => {
    await fetch(`${API}/stop`, { method: "POST" });
    setCapturing(false);
  };

  const exportPcap = async () => {
    const filename = prompt("Export filename (default: capture.pcap)") || "capture.pcap";
    await fetch(`${API}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    });
  };

  return {
    packets,
    stats,
    suspicious,
    capturing,
    loading,
    error,
    lastPacketId,
    startCapture,
    stopCapture,
    exportPcap
  };
}
