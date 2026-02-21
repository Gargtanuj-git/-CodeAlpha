"""FastAPI backend for real-time network analyzer."""

from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .sniffer import PacketSniffer, PacketStore
from .websocket_manager import WebSocketManager


class StartRequest(BaseModel):
    protocol: Optional[str] = None
    ip: Optional[str] = None
    port: Optional[int] = None
    iface: Optional[str] = None
    emit_interval_ms: Optional[int] = None


class ExportRequest(BaseModel):
    filename: Optional[str] = None


class NmapRequest(BaseModel):
    target: Optional[str] = "127.0.0.1"


app = FastAPI(title="Network Traffic Analyzer")
manager = WebSocketManager()
store = PacketStore()
sniffer = PacketSniffer(store, manager)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    manager.set_loop(asyncio.get_running_loop())


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/status")
def status() -> dict:
    return sniffer.status()


@app.get("/stats")
def stats() -> dict:
    return store.stats()


@app.get("/packets")
def packets(limit: int = 200) -> dict:
    return {"packets": store.recent_packets(limit)}


@app.get("/suspicious")
def suspicious() -> dict:
    return {"events": store.suspicious_events[-200:]}


@app.post("/start")
def start_capture(request: StartRequest) -> dict:
    started = sniffer.start(
        protocol=request.protocol,
        ip_filter=request.ip,
        port=request.port,
        iface=request.iface,
        emit_interval_ms=request.emit_interval_ms,
    )
    return {"started": started}


@app.post("/stop")
def stop_capture() -> dict:
    sniffer.stop()
    return {"stopped": True}


@app.post("/export")
def export_pcap(request: ExportRequest) -> dict:
    name = sniffer.export_pcap(request.filename)
    return {"file": name}


@app.get("/interfaces")
def interfaces() -> dict:
    return {"interfaces": sniffer.list_interfaces()}


@app.post("/export/json")
def export_json() -> dict:
    return {"packets": store.recent_packets(500)}


@app.post("/export/csv")
def export_csv() -> dict:
    return {"csv": sniffer.export_csv()}


@app.post("/nmap")
def run_nmap(request: NmapRequest) -> dict:
    return sniffer.run_nmap(request.target)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
