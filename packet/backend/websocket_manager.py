"""WebSocket connection manager."""

from __future__ import annotations

import asyncio
from typing import Set

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)

    async def broadcast(self, message: dict) -> None:
        if not self._clients:
            return
        stale = []
        for ws in self._clients:
            try:
                await ws.send_json(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self._clients.discard(ws)

    def broadcast_sync(self, message: dict) -> None:
        if not self._loop:
            return
        asyncio.run_coroutine_threadsafe(self.broadcast(message), self._loop)
