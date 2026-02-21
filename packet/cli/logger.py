"""Simple packet logger to a text file."""

from __future__ import annotations

from typing import Optional


class PacketLogger:
    def __init__(self, path: str = "capture.log") -> None:
        self._path = path
        self._fh: Optional[object] = open(self._path, "a", encoding="utf-8")

    def write(self, line: str) -> None:
        if self._fh:
            self._fh.write(line + "\n")
            self._fh.flush()

    def close(self) -> None:
        if self._fh:
            self._fh.close()
            self._fh = None
