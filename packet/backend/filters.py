"""BPF filter helpers for capture filtering."""

from typing import Optional


def build_bpf_filter(protocol: Optional[str], ip_filter: Optional[str], port: Optional[int]) -> str:
    parts = []

    if protocol:
        normalized = protocol.strip().lower()
        if normalized == "tcp":
            parts.append("tcp")
        elif normalized == "udp":
            parts.append("udp")
        elif normalized == "icmp":
            parts.append("icmp")

    if ip_filter:
        parts.append(f"host {ip_filter}")

    if port:
        parts.append(f"port {port}")

    return " and ".join(parts)
