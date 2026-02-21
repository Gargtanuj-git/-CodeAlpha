"""Packet capture and analysis logic using Scapy."""

from __future__ import annotations

import time
from collections import Counter, deque
from dataclasses import dataclass
from typing import Deque, Dict, List, Optional

from scapy.all import ARP, ICMP, IP, TCP, UDP, Raw, conf, get_if_list, sniff, wrpcap

from filters import build_bpf_filter, protocol_of_packet
from logger import PacketLogger
from utils import (
    color_text,
    format_packet_line,
    format_packet_header,
    format_stats_dashboard,
    safe_decode_payload,
    utc_timestamp,
)


@dataclass
class SuspiciousEvent:
    timestamp: str
    source_ip: str
    reason: str


class Sniffer:
    def __init__(self) -> None:
        self._running = False
        self._packets: List = []
        self._protocol_counts: Counter = Counter()
        self._suspicious: List[SuspiciousEvent] = []
        self._syn_tracker: Dict[str, Deque[float]] = {}
        self._logger: Optional[PacketLogger] = None

    def start_capture(
        self,
        mode: str,
        ip_filter: Optional[str],
        port_filter: Optional[int],
        save_pcap: bool,
        save_log: bool,
        iface: Optional[str] = None,
    ) -> None:
        self._running = True
        self._packets = []
        self._protocol_counts = Counter()
        self._suspicious = []
        self._syn_tracker = {}

        if save_log:
            self._logger = PacketLogger()
        else:
            self._logger = None

        bpf = build_bpf_filter(mode, ip_filter, port_filter)
        iface_name = iface or conf.iface
        print(color_text("\nStarting capture... Press Ctrl+C to stop.", "green"))
        print(color_text(f"Interface: {iface_name}", "cyan"))
        if bpf:
            print(color_text(f"BPF Filter: {bpf}", "yellow"))
        print(color_text(format_packet_header(), "yellow"))

        sniff(
            prn=self._handle_packet,
            store=False,
            filter=bpf,
            stop_filter=self._stop_filter,
            iface=iface,
        )

        self._running = False
        if save_pcap and self._packets:
            wrpcap("capture.pcap", self._packets)
            print(color_text("Saved capture.pcap", "green"))
        if self._logger:
            self._logger.close()
            print(color_text("Saved capture.log", "green"))

        print(format_stats_dashboard(self._protocol_counts, len(self._packets)))
        if self._suspicious:
            print(color_text("\nSuspicious packets:", "red"))
            for event in self._suspicious:
                print(color_text(f"[{event.timestamp}] {event.source_ip} -> {event.reason}", "red"))

    def stop_capture(self) -> None:
        self._running = False

    def _stop_filter(self, _pkt) -> bool:
        return not self._running

    def _handle_packet(self, pkt) -> None:
        timestamp = utc_timestamp()
        proto = protocol_of_packet(pkt)
        self._protocol_counts[proto] += 1

        src_ip = dst_ip = "-"
        src_port = dst_port = "-"
        payload = "-"

        if IP in pkt:
            src_ip = pkt[IP].src
            dst_ip = pkt[IP].dst
        elif ARP in pkt:
            src_ip = pkt[ARP].psrc
            dst_ip = pkt[ARP].pdst

        if TCP in pkt:
            src_port = str(pkt[TCP].sport)
            dst_port = str(pkt[TCP].dport)
        elif UDP in pkt:
            src_port = str(pkt[UDP].sport)
            dst_port = str(pkt[UDP].dport)
        elif ICMP in pkt:
            src_port = "-"
            dst_port = "-"

        if Raw in pkt:
            payload = safe_decode_payload(bytes(pkt[Raw].load))

        length = len(pkt)
        line = format_packet_line(
            timestamp, src_ip, dst_ip, proto, src_port, dst_port, payload, length
        )

        is_suspicious = self._check_syn_flood(pkt, src_ip, timestamp)
        if is_suspicious:
            print(color_text(line, "red"))
        else:
            print(color_text(line, "white"))

        self._packets.append(pkt)
        if self._logger:
            self._logger.write(line)

        if len(self._packets) % 10 == 0:
            print(format_stats_dashboard(self._protocol_counts, len(self._packets)))

    def _check_syn_flood(self, pkt, src_ip: str, timestamp: str) -> bool:
        if TCP in pkt and pkt[TCP].flags == "S":
            now = time.time()
            history = self._syn_tracker.setdefault(src_ip, deque())
            history.append(now)
            while history and now - history[0] > 5:
                history.popleft()
            if len(history) >= 50:
                self._suspicious.append(
                    SuspiciousEvent(timestamp, src_ip, "Possible SYN flood")
                )
                return True
        return False

    @staticmethod
    def list_interfaces() -> List[str]:
        try:
            return get_if_list()
        except Exception:
            return [str(conf.iface)]
