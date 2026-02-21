"""Scapy-based packet sniffer with in-memory storage and IDS example."""

from __future__ import annotations

import csv
import io
import os
import shutil
import subprocess
import threading
import time
from collections import Counter, deque
from dataclasses import dataclass
from typing import Deque, Dict, List, Optional

from scapy.all import ARP, ICMP, IP, TCP, UDP, Raw, get_if_list, sniff, wrpcap

from .filters import build_bpf_filter
from .websocket_manager import WebSocketManager


@dataclass
class PacketRecord:
    timestamp: str
    src_ip: str
    dst_ip: str
    protocol: str
    src_port: str
    dst_port: str
    length: int
    payload: str
    suspicious: bool


class PacketStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.packets: Deque[PacketRecord] = deque(maxlen=500)
        self.raw_packets: Deque = deque(maxlen=5000)
        self.protocol_counts: Counter = Counter()
        self.top_sources: Counter = Counter()
        self.top_dest_ports: Counter = Counter()
        self.time_series: Deque[dict] = deque(maxlen=120)
        self.total_count = 0
        self.suspicious_events: List[dict] = []

    def add_packet(self, record: PacketRecord, raw_pkt, suspicious_reason: Optional[str]) -> None:
        with self._lock:
            self.packets.append(record)
            self.raw_packets.append(raw_pkt)
            self.total_count += 1
            self.protocol_counts[record.protocol] += 1
            if record.src_ip != "-":
                self.top_sources[record.src_ip] += 1
            if record.dst_port != "-":
                self.top_dest_ports[record.dst_port] += 1

            now = int(time.time())
            if self.time_series and self.time_series[-1]["t"] == now:
                self.time_series[-1]["count"] += 1
            else:
                self.time_series.append({"t": now, "count": 1})

            if suspicious_reason:
                event = {
                    "timestamp": record.timestamp,
                    "source_ip": record.src_ip,
                    "reason": suspicious_reason,
                }
                self.suspicious_events.append(event)
                self._write_suspicious_log(event)

    def _write_suspicious_log(self, event: dict) -> None:
        os.makedirs("backend/logs", exist_ok=True)
        path = os.path.join("backend", "logs", "suspicious.log")
        line = f"[{event['timestamp']}] {event['source_ip']} -> {event['reason']}"
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(line + "\n")

    def recent_packets(self, limit: int) -> List[dict]:
        with self._lock:
            return [record.__dict__ for record in list(self.packets)[-limit:]]

    def stats(self) -> dict:
        with self._lock:
            return {
                "total": self.total_count,
                "protocols": dict(self.protocol_counts),
                "top_sources": self.top_sources.most_common(5),
                "top_dest_ports": self.top_dest_ports.most_common(5),
                "time_series": list(self.time_series),
                "suspicious_count": len(self.suspicious_events),
            }


class PacketSniffer:
    def __init__(self, store: PacketStore, manager: WebSocketManager) -> None:
        self._store = store
        self._manager = manager
        self._running = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._syn_tracker: Dict[str, Deque[float]] = {}
        self._status = "stopped"
        self._error: Optional[str] = None
        self._emit_interval_ms: Optional[int] = None
        self._last_emit = 0.0

    def start(
        self,
        protocol: Optional[str],
        ip_filter: Optional[str],
        port: Optional[int],
        iface: Optional[str],
        emit_interval_ms: Optional[int],
    ) -> bool:
        if self._thread and self._thread.is_alive():
            return False
        self._syn_tracker = {}
        self._running.set()
        self._status = "running"
        self._error = None
        self._emit_interval_ms = emit_interval_ms
        self._last_emit = 0.0
        self._thread = threading.Thread(
            target=self._sniff_loop,
            args=(protocol, ip_filter, port, iface),
            daemon=True,
        )
        self._thread.start()
        return True

    def stop(self) -> None:
        self._running.clear()
        self._status = "stopping"

    def status(self) -> dict:
        return {"status": self._status, "error": self._error}

    def export_pcap(self, filename: Optional[str]) -> str:
        name = filename or "capture.pcap"
        wrpcap(name, list(self._store.raw_packets))
        return name

    def export_csv(self) -> str:
        path = os.path.join("backend", "logs", "packets.csv")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            [
                "timestamp",
                "src_ip",
                "dst_ip",
                "protocol",
                "src_port",
                "dst_port",
                "length",
                "payload",
                "suspicious",
            ]
        )
        for record in list(self._store.packets):
            writer.writerow(
                [
                    record.timestamp,
                    record.src_ip,
                    record.dst_ip,
                    record.protocol,
                    record.src_port,
                    record.dst_port,
                    record.length,
                    record.payload,
                    record.suspicious,
                ]
            )
        content = buffer.getvalue()
        with open(path, "w", newline="", encoding="utf-8") as handle:
            handle.write(content)
        return content

    def run_nmap(self, target: Optional[str]) -> dict:
        if not target:
            target = "127.0.0.1"
        allowed = {"127.0.0.1", "localhost"}
        if target not in allowed:
            return {"ok": False, "error": "Only localhost scans are allowed."}
        if not shutil.which("nmap"):
            return {"ok": False, "error": "Nmap not found in PATH."}
        try:
            result = subprocess.run(
                ["nmap", "-sS", "-Pn", target],
                capture_output=True,
                text=True,
                timeout=60,
            )
            output = (result.stdout or "") + (result.stderr or "")
            return {"ok": result.returncode == 0, "output": output[-4000:]}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def _sniff_loop(self, protocol: Optional[str], ip_filter: Optional[str], port: Optional[int], iface: Optional[str]) -> None:
        try:
            bpf = build_bpf_filter(protocol, ip_filter, port)
            sniff(
                prn=self._handle_packet,
                store=False,
                filter=bpf if bpf else None,
                stop_filter=self._should_stop,
                iface=iface,
            )
            self._status = "stopped"
        except Exception as exc:
            self._status = "error"
            self._error = str(exc)
        finally:
            self._running.clear()

    def _should_stop(self, _pkt) -> bool:
        return not self._running.is_set()

    def _handle_packet(self, pkt) -> None:
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
        protocol = self._protocol_of(pkt)
        src_ip, dst_ip = self._ips_of(pkt)
        src_port, dst_port = self._ports_of(pkt)
        payload = self._payload_of(pkt)
        length = len(pkt)

        suspicious_reason = self._check_syn_flood(pkt, src_ip)
        record = PacketRecord(
            timestamp=timestamp,
            src_ip=src_ip,
            dst_ip=dst_ip,
            protocol=protocol,
            src_port=src_port,
            dst_port=dst_port,
            length=length,
            payload=payload,
            suspicious=bool(suspicious_reason),
        )

        self._store.add_packet(record, pkt, suspicious_reason)
        if self._should_emit():
            self._manager.broadcast_sync({"type": "packet", "data": record.__dict__})

    def _protocol_of(self, pkt) -> str:
        if pkt.haslayer("TCP"):
            return "TCP"
        if pkt.haslayer("UDP"):
            return "UDP"
        if pkt.haslayer("ICMP"):
            return "ICMP"
        if pkt.haslayer("ARP"):
            return "ARP"
        if pkt.haslayer("IP"):
            return "IP"
        return "OTHER"

    def _ips_of(self, pkt) -> tuple[str, str]:
        if IP in pkt:
            return pkt[IP].src, pkt[IP].dst
        if ARP in pkt:
            return pkt[ARP].psrc, pkt[ARP].pdst
        return "-", "-"

    def _ports_of(self, pkt) -> tuple[str, str]:
        if TCP in pkt:
            return str(pkt[TCP].sport), str(pkt[TCP].dport)
        if UDP in pkt:
            return str(pkt[UDP].sport), str(pkt[UDP].dport)
        return "-", "-"

    def _payload_of(self, pkt) -> str:
        if Raw in pkt:
            try:
                return bytes(pkt[Raw].load).decode("utf-8", errors="replace")[:200]
            except Exception:
                return "<binary>"
        return "-"

    def _check_syn_flood(self, pkt, src_ip: str) -> Optional[str]:
        if TCP in pkt and pkt[TCP].flags == "S":
            now = time.time()
            history = self._syn_tracker.setdefault(src_ip, deque())
            history.append(now)
            while history and now - history[0] > 5:
                history.popleft()
            if len(history) >= 50:
                return "Possible SYN flood"
        return None

    def _should_emit(self) -> bool:
        if not self._emit_interval_ms:
            return True
        now = time.time()
        if (now - self._last_emit) * 1000 >= self._emit_interval_ms:
            self._last_emit = now
            return True
        return False

    @staticmethod
    def list_interfaces() -> List[str]:
        try:
            return get_if_list()
        except Exception:
            return []
