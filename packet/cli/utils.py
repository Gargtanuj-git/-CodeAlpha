"""Utility helpers for formatting and terminal UX."""

from __future__ import annotations

import datetime as dt
import ipaddress
import os
from typing import Optional
try:
    from colorama import Fore, Style, init as colorama_init

    colorama_init(autoreset=True)
    COLOR_ENABLED = True
except Exception:
    COLOR_ENABLED = False


COLOR_MAP = {
    "red": "RED",
    "green": "GREEN",
    "yellow": "YELLOW",
    "cyan": "CYAN",
    "white": "WHITE",
}


def banner() -> str:
    return (
        "==================================================\n"
        "    MINI WIRESHARK CLI - PYTHON PACKET SNIFFER\n"
        "==================================================\n"
    )


def clear_screen() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def color_text(text: str, color: str) -> str:
    if not COLOR_ENABLED:
        return text
    name = COLOR_MAP.get(color, "WHITE")
    return getattr(Fore, name) + text + Style.RESET_ALL


def safe_decode_payload(raw: bytes) -> str:
    try:
        decoded = raw.decode("utf-8", errors="replace")
        return decoded.replace("\r", " ").replace("\n", " ")[:200]
    except Exception:
        return "<binary>"


def utc_timestamp() -> str:
    return dt.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


def format_packet_line(
    timestamp: str,
    src_ip: str,
    dst_ip: str,
    proto: str,
    src_port: str,
    dst_port: str,
    payload: str,
    length: int,
) -> str:
    return (
        f"[{timestamp}] {proto} {src_ip}:{src_port} -> {dst_ip}:{dst_port} "
        f"len={length} payload=\"{payload}\""
    )


def format_packet_header() -> str:
    return (
        "[TIME]                   PROTO  SRC:PORT -> DST:PORT           LEN  PAYLOAD"
    )


def format_stats_dashboard(protocol_counts, total: int) -> str:
    if total == 0:
        return "[Stats] No packets captured yet."
    parts = [f"{k}:{v}" for k, v in protocol_counts.items()]
    return f"[Stats] Total={total} | " + " ".join(parts)


def prompt_optional_ip(prompt: str) -> Optional[str]:
    value = input(prompt).strip()
    if not value:
        return None
    try:
        ipaddress.ip_address(value)
        return value
    except ValueError:
        print("Invalid IP. Skipping filter.")
        return None


def prompt_optional_int(prompt: str) -> Optional[int]:
    value = input(prompt).strip()
    if not value:
        return None
    if not value.isdigit():
        print("Invalid port. Skipping filter.")
        return None
    return int(value)
