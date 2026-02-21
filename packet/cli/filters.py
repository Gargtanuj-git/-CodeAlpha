"""Capture filter helpers."""

from typing import Optional


def build_bpf_filter(
    mode: str, ip_filter: Optional[str], port_filter: Optional[int]
) -> str:
    bpf_parts = []

    if mode == "2":
        bpf_parts.append("tcp")
    elif mode == "3":
        bpf_parts.append("udp")
    elif mode == "4":
        bpf_parts.append("icmp")
    elif mode == "5":
        bpf_parts.append("tcp port 80 or tcp port 8080")

    if ip_filter:
        bpf_parts.append(f"host {ip_filter}")
    if port_filter:
        bpf_parts.append(f"port {port_filter}")

    return " and ".join(bpf_parts)


def protocol_of_packet(pkt) -> str:
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
