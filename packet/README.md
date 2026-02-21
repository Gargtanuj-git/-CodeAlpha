# Network Traffic Analyzer Dashboard

A professional, full-stack network traffic analyzer with real-time packet visualization. Built for Windows using Scapy + FastAPI on the backend and React + Tailwind on the frontend.

This project provides a modern, responsive cybersecurity dashboard with live packet feeds, protocol charts, filtering, and basic intrusion detection.

## Features
- Live packet capture with Scapy (TCP/UDP/ICMP/ARP/IP)
- WebSocket streaming to the UI in real time
- Packet details: source/destination IP, ports, protocol, payload, length, timestamp
- Protocol distribution, packet rate, top source IPs, top destination ports
- Filters: protocol, IP, port
- Save packets to `.pcap`
- Export packets to JSON/CSV
- Suspicious packet logging (SYN flood heuristic)
- Settings tab: interface selection, stream throttle, UI limits
- Local Nmap scan trigger (localhost only)
- Glassmorphism cybersecurity UI with dark/light toggle
- Responsive layout with collapsible sidebar

## Project Structure
```
cli/
   main.py
   sniffer.py
   filters.py
   logger.py
   utils.py
   socket_example.py
   requirements.txt
   TECHNICAL_GUIDE.md
   REQUIREMENTS_CHECKLIST.md
backend/
   main.py
   sniffer.py
   websocket_manager.py
   filters.py
   requirements.txt
frontend/
   index.html
   package.json
   tailwind.config.js
   vite.config.js
   src/
      components/
      pages/
      charts/
README.md
```

## Windows Setup (Step-by-Step)

### 1) Install Python
- Download Python 3.10+ from https://www.python.org
- Enable "Add Python to PATH"

### 2) Install Node.js
- Download from https://nodejs.org (LTS recommended)

### 3) Install Npcap (Required)
- Download from https://npcap.com
- Enable "WinPcap API-compatible Mode" during install

### 4) Backend Setup (Run as Administrator)
```powershell
cd "C:\Users\tanuj Garg\Downloads\project\Python"
python -m venv .venv
\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload
```

### 5) Frontend Setup
```powershell
cd "C:\Users\tanuj Garg\Downloads\project\Python\frontend"
npm install
npm run dev
```

Open the UI at: http://localhost:5173

## Architecture Overview
- **Scapy** captures live packets in a background thread
- **FastAPI** exposes REST endpoints and a WebSocket stream
- **In-memory store** tracks packets, stats, and suspicious events
- **React** consumes the WebSocket feed and renders charts and tables
- **Tailwind** provides responsive, modern styling

## REST Endpoints
- `GET /health` - Health check
- `GET /stats` - Protocol counts, time series, top sources/ports
- `GET /packets` - Latest packets
- `POST /start` - Start capture with filters
- `POST /stop` - Stop capture
- `POST /export` - Save `.pcap`
- `GET /suspicious` - Suspicious packet list

## WebSocket
- `ws://localhost:8000/ws` - Live packet stream

## Optional CLI Sniffer (Legacy)
```powershell
cd "C:\Users\tanuj Garg\Downloads\project\Python\cli"
pip install -r requirements.txt
python main.py
```

## Example Screens (Description)
1. **Dashboard Overview**: Glassmorphism panels with total packets, suspicious count, and capture indicator.
2. **Charts Section**: Protocol donut chart and packets-over-time line chart.
3. **Top Talkers**: Bar charts for top source IPs and destination ports.
4. **Packet Feed**: Highlighted rows as new packets arrive, with search and sorting.
5. **Admin Warning Page**: Steps for Npcap install and admin privileges.

## Security and Ethics
- Capture only on networks you own or have explicit permission to monitor.
- Unauthorized packet capture may be illegal and unethical.
- Use admin privileges responsibly and limit stored data.

## Troubleshooting
- **No packets**: Run backend as Administrator and verify Npcap installation.
- **WebSocket errors**: Ensure backend runs on `localhost:8000`.
- **CORS issues**: Keep frontend at `localhost:5173`.

## Resume Bullet Points
- Built a real-time network traffic analyzer with Scapy, FastAPI, and WebSockets, streaming live packets into a modern React dashboard.
- Implemented protocol filtering, statistics, `.pcap` export, and SYN-flood detection for basic intrusion alerts.
- Designed a responsive cybersecurity UI with charts, live feeds, and role-based operational warnings.

## Notes
The original CLI-based sniffer now lives under the `cli/` folder for clean separation.
