# Technical Guide: Network Packet Sniffing

## How This Project Meets Learning Objectives

### 1. Capture Network Traffic Packets ✓
**Implementation:** [sniffer.py](sniffer.py#L63-L69)
- Uses Scapy's `sniff()` function with BPF (Berkeley Packet Filter) for efficient capture
- Supports interface selection and live packet streaming
- Captures at Data Link Layer (Layer 2) for complete packet visibility

**Code Explanation:**
```python
sniff(prn=self._handle_packet, store=False, filter=bpf, stop_filter=self._stop_filter, iface=iface)
```
- `prn`: callback function invoked for each packet
- `store=False`: stream packets without storing all in memory (memory efficient)
- `filter`: BPF filter for protocol/IP/port filtering at kernel level
- `iface`: network interface to capture from

---

### 2. Analyze Packet Structure and Content ✓
**Implementation:** [sniffer.py](sniffer.py#L91-L122)

**Packet Structure Analysis:**
```
Ethernet Frame
  └─ IP Header (if IP packet)
       ├─ Source IP: pkt[IP].src
       ├─ Destination IP: pkt[IP].dst
       └─ Transport Layer
            ├─ TCP: pkt[TCP].sport, pkt[TCP].dport, pkt[TCP].flags
            ├─ UDP: pkt[UDP].sport, pkt[UDP].dport
            └─ ICMP: pkt[ICMP].type
  └─ ARP (if ARP packet)
       ├─ Protocol Source: pkt[ARP].psrc
       └─ Protocol Destination: pkt[ARP].pdst
```

**Safe Payload Extraction:** [utils.py](utils.py#L46-L52)
```python
def safe_decode_payload(raw: bytes) -> str:
    try:
        decoded = raw.decode("utf-8", errors="replace")
        return decoded.replace("\r", " ").replace("\n", " ")[:200]
    except Exception:
        return "<binary>"
```
Handles binary data gracefully, prevents crashes from non-UTF8 payloads.

---

### 3. Understand Data Flow and Protocol Basics ✓

**OSI Model Mapping in Code:**
| OSI Layer | TCP/IP Layer | Scapy Detection | Our Code |
|-----------|--------------|-----------------|----------|
| Layer 2 (Data Link) | Link | Ethernet | Captured by default |
| Layer 3 (Network) | Internet | IP, ARP | `if IP in pkt:` |
| Layer 4 (Transport) | Transport | TCP, UDP, ICMP | `if TCP in pkt:` |
| Layer 7 (Application) | Application | HTTP, DNS | Payload analysis |

**Protocol Detection:** [filters.py](filters.py#L19-L30)
```python
def protocol_of_packet(pkt) -> str:
    if pkt.haslayer("TCP"): return "TCP"
    if pkt.haslayer("UDP"): return "UDP"
    if pkt.haslayer("ICMP"): return "ICMP"
    if pkt.haslayer("ARP"): return "ARP"
    ...
```

**Data Flow Visualization:**
```
[Client 192.168.1.10:51023] 
         ↓ SYN
     [Internet]
         ↓
[Server 142.250.74.78:443]
         ↓ SYN-ACK
     [Internet]
         ↓
[Client] TCP connection established
```
Each packet shows: `SRC_IP:SRC_PORT -> DST_IP:DST_PORT`

---

### 4. Use Scapy and Socket Libraries ✓

**Scapy (Primary Implementation):**
- High-level packet manipulation
- Automatic protocol parsing
- Cross-platform support
- Built-in packet dissection

**Socket (Alternative - See socket_example.py):**
- Lower-level control
- Direct OS socket API
- Manual byte parsing required
- Platform-specific (Windows uses raw sockets differently)

**Comparison Table:**

| Feature | Scapy | Raw Socket |
|---------|-------|------------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Protocol Parsing | Automatic | Manual |
| Performance | Good | Excellent |
| Portability | High | Platform-dependent |
| Learning Curve | Gentle | Steep |

---

### 5. Display Network Information ✓

**Information Extracted:**

1. **Timestamp** - [utils.py](utils.py#L55-L56): `datetime.utcnow()`
2. **Source IP** - [sniffer.py](sniffer.py#L99-L100): `pkt[IP].src`
3. **Destination IP** - [sniffer.py](sniffer.py#L100): `pkt[IP].dst`
4. **Protocol** - [filters.py](filters.py#L19): `protocol_of_packet(pkt)`
5. **Ports** - [sniffer.py](sniffer.py#L104-L111): TCP/UDP sport/dport
6. **Payload** - [sniffer.py](sniffer.py#L113-L114): `bytes(pkt[Raw].load)`
7. **Packet Length** - [sniffer.py](sniffer.py#L116): `len(pkt)`

**Output Format:** [utils.py](utils.py#L59-L71)
```
[2026-02-20 09:12:33] TCP 192.168.1.10:51023 -> 142.250.74.78:443 len=66 payload="GET / HTTP/1.1..."
```

---

## Advanced Features Explained

### Real-Time Statistics
**Implementation:** [sniffer.py](sniffer.py#L133-L134)
- Uses Python `Counter` to track protocol distribution
- Updates every 10 packets for performance
- Shows total packets and breakdown by protocol

### SYN Flood Detection
**Implementation:** [sniffer.py](sniffer.py#L138-L150)
```python
def _check_syn_flood(self, pkt, src_ip: str, timestamp: str) -> bool:
    if TCP in pkt and pkt[TCP].flags == "S":  # SYN flag only
        now = time.time()
        history = self._syn_tracker.setdefault(src_ip, deque())
        history.append(now)
        # Keep only last 5 seconds
        while history and now - history[0] > 5:
            history.popleft()
        # Alert if >50 SYNs in 5 seconds
        if len(history) >= 50:
            self._suspicious.append(...)
            return True
```

**Why This Matters:**
- Normal connections: 1-10 SYNs per second
- SYN flood attack: 100+ SYNs per second from same IP
- Uses sliding window for accurate detection

### BPF Filters
**Implementation:** [filters.py](filters.py#L6-L22)

BPF (Berkeley Packet Filter) runs in kernel space for efficiency:
```
"tcp and port 80"           → Capture only HTTP traffic
"host 192.168.1.1"          → Capture only packets to/from specific IP
"tcp and port 80 and host 192.168.1.1" → Combined filter
```

Kernel-level filtering is 10-100x faster than application-level filtering.

---

## How Scapy Parses Packets Internally

1. **Capture Raw Bytes** → Scapy receives packet as byte stream from OS
2. **Layer Detection** → Identifies Ethernet header (first 14 bytes)
3. **Protocol Dissection** → Reads EtherType field to determine next layer (0x0800 = IPv4)
4. **Recursive Parsing** → Each layer parses its header and passes payload to next layer
5. **Object Creation** → Creates linked list of protocol objects: `Ether/IP/TCP/Raw`

**Example:**
```python
pkt = Ether(raw_bytes)
# Scapy automatically creates: Ether() / IP() / TCP() / Raw()
print(pkt[IP].src)  # Access third layer directly
```

---

## Socket vs Scapy: Technical Comparison

### Raw Socket Approach (Low-Level)
```python
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
raw_packet = s.recvfrom(65535)[0]
# Now manually parse bytes:
ip_header = raw_packet[0:20]
src_ip = socket.inet_ntoa(ip_header[12:16])  # Manual offset calculation
```

**Challenges:**
- Must know exact byte offsets for each protocol
- Need to handle byte order (network vs host)
- Must implement parsing for each protocol
- Platform-specific socket options

### Scapy Approach (High-Level)
```python
from scapy.all import sniff
def callback(pkt):
    print(pkt[IP].src)  # Automatic parsing
sniff(prn=callback, count=10)
```

**Benefits:**
- Protocol objects with named fields
- Automatic byte order handling
- Cross-platform compatibility
- Built-in packet crafting

---

## Running the Project

### Prerequisites
1. **Windows**: Npcap installed (https://npcap.com)
2. **Python 3.10+**
3. **Administrator privileges**

### Installation
```powershell
pip install -r requirements.txt
```

### Execution
```powershell
# Run as Administrator
python main.py
```

### Expected Workflow
1. Select network interface (WiFi, Ethernet, etc.)
2. Choose capture mode (TCP/UDP/ICMP/HTTP/All)
3. Optionally add IP/port filters
4. Choose to save .pcap or .txt logs
5. Watch live packets stream
6. Press Ctrl+C to stop
7. View statistics and suspicious packets summary

---

## Code Architecture

```
main.py              → CLI menu and user interaction
    ↓
sniffer.py           → Packet capture engine (Scapy)
    ↓
filters.py           → BPF filter construction + protocol detection
    ↓
logger.py            → Text file logging
    ↓
utils.py             → Formatting, colors, validation
```

**Design Patterns Used:**
- **Modular Design**: Separation of concerns (capture, filter, log, display)
- **Callback Pattern**: `sniff(prn=callback)` for event-driven processing
- **Data Classes**: `@dataclass` for suspicious events
- **Type Hints**: Full type annotations for clarity

---

## Performance Considerations

1. **Stream Processing**: `store=False` prevents memory exhaustion
2. **Kernel Filtering**: BPF filters at kernel level, not Python level
3. **Efficient Data Structures**: `Counter` for stats, `deque` for sliding windows
4. **Payload Truncation**: Limit to 200 chars to prevent log bloat

---

## Ethical and Legal Considerations

### Legal Requirements
- **Authorized Networks Only**: Only capture on networks you own or have written permission
- **No Credential Harvesting**: Do not log passwords or sensitive data
- **Compliance**: Follow local laws (e.g., GDPR, CCPA)

### Ethical Guidelines
- **Transparency**: Inform users if monitoring corporate network
- **Data Minimization**: Capture only what's needed for learning
- **Secure Storage**: Encrypt .pcap files if they contain sensitive data
- **Responsible Disclosure**: If you discover vulnerabilities, report them responsibly

**Warning:** Unauthorized packet capture is illegal in most jurisdictions and violates network policies. This tool is for educational purposes only.

---

## Further Learning

1. **Wireshark**: GUI-based packet analyzer (gold standard)
2. **tcpdump**: Command-line packet capture
3. **Bro/Zeek**: Network security monitoring
4. **Snort**: Intrusion detection system

**Books:**
- "The TCP/IP Guide" by Charles Kozierok
- "Network Security Through Data Analysis" by Michael Collins

**Practice:**
- Capture HTTP traffic and rebuild web pages
- Detect DNS tunneling
- Identify malware C2 communication patterns
