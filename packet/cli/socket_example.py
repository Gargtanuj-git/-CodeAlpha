"""
Socket-based packet sniffing example (for educational comparison).
This demonstrates LOW-LEVEL packet capture using raw sockets.

WARNING: 
- Windows requires Administrator privileges
- Windows raw sockets have platform-specific limitations
- This is more complex than Scapy but shows how it works under the hood

Compare this with sniffer.py to understand why Scapy is preferred.
"""

import socket
import struct
import sys


def parse_ethernet_frame(data):
    """Parse Ethernet frame (Layer 2)."""
    dest_mac, src_mac, proto = struct.unpack("! 6s 6s H", data[:14])
    return (
        format_mac(dest_mac),
        format_mac(src_mac),
        socket.htons(proto),
        data[14:],
    )


def format_mac(mac_bytes):
    """Format MAC address from bytes."""
    return ":".join(f"{b:02x}" for b in mac_bytes)


def parse_ipv4_header(data):
    """Parse IPv4 header (Layer 3) - 20 bytes minimum."""
    version_header_length = data[0]
    header_length = (version_header_length & 15) * 4
    ttl, proto, src, dest = struct.unpack("! 8x B B 2x 4s 4s", data[:20])
    return (
        ttl,
        proto,
        socket.inet_ntoa(src),
        socket.inet_ntoa(dest),
        data[header_length:],
    )


def parse_tcp_header(data):
    """Parse TCP header (Layer 4) - 20 bytes minimum."""
    src_port, dest_port, seq, ack, offset_flags = struct.unpack("! H H L L H", data[:14])
    offset = (offset_flags >> 12) * 4
    flag_urg = (offset_flags & 32) >> 5
    flag_ack = (offset_flags & 16) >> 4
    flag_psh = (offset_flags & 8) >> 3
    flag_rst = (offset_flags & 4) >> 2
    flag_syn = (offset_flags & 2) >> 1
    flag_fin = offset_flags & 1
    return src_port, dest_port, seq, ack, flag_urg, flag_ack, flag_psh, flag_rst, flag_syn, flag_fin, data[offset:]


def parse_udp_header(data):
    """Parse UDP header (Layer 4) - 8 bytes."""
    src_port, dest_port, length = struct.unpack("! H H 2x H", data[:8])
    return src_port, dest_port, length, data[8:]


def parse_icmp_header(data):
    """Parse ICMP header (Layer 4) - 8 bytes minimum."""
    icmp_type, code, checksum = struct.unpack("! B B H", data[:4])
    return icmp_type, code, checksum, data[4:]


def main():
    """Main packet capture loop using raw sockets."""
    print("=" * 60)
    print("  SOCKET-BASED PACKET SNIFFER (Educational Example)")
    print("=" * 60)
    print("\nThis demonstrates LOW-LEVEL packet capture.")
    print("Compare with sniffer.py (Scapy) to see the difference.\n")

    # Create raw socket
    # Windows: socket.IPPROTO_IP for IP-level capture
    # Linux: socket.ntohs(0x0003) for all packets
    try:
        if sys.platform == "win32":
            # Windows raw socket setup
            conn = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
            # Bind to local host
            host = socket.gethostbyname(socket.gethostname())
            conn.bind((host, 0))
            # Enable promiscuous mode (receive all packets)
            conn.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
            # Enable IOCTL to receive all packets
            conn.ioctl(socket.SIO_RCVALL, socket.RCVALL_ON)
            print(f"Listening on {host} (Windows raw socket mode)")
        else:
            # Linux raw socket setup
            conn = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(0x0003))
            print("Listening on all interfaces (Linux raw socket mode)")

        print("Capturing packets... Press Ctrl+C to stop.\n")
        packet_count = 0

        while True:
            # Receive packet (up to 65535 bytes)
            raw_data, addr = conn.recvfrom(65535)
            packet_count += 1

            if sys.platform == "win32":
                # Windows: data starts at IP layer (no Ethernet header)
                ttl, proto, src_ip, dest_ip, data = parse_ipv4_header(raw_data)
                print(f"\n[Packet #{packet_count}]")
                print(f"  IPv4: {src_ip} -> {dest_ip} (TTL: {ttl})")

                # Parse transport layer
                if proto == 6:  # TCP
                    src_port, dest_port, seq, ack, urg, ack_f, psh, rst, syn, fin, payload = parse_tcp_header(data)
                    flags = f"{'U' if urg else ''}{'A' if ack_f else ''}{'P' if psh else ''}{'R' if rst else ''}{'S' if syn else ''}{'F' if fin else ''}"
                    print(f"  TCP: {src_port} -> {dest_port} (Flags: {flags})")
                    print(f"  Payload: {payload[:50]}...")

                elif proto == 17:  # UDP
                    src_port, dest_port, length, payload = parse_udp_header(data)
                    print(f"  UDP: {src_port} -> {dest_port} (Length: {length})")
                    print(f"  Payload: {payload[:50]}...")

                elif proto == 1:  # ICMP
                    icmp_type, code, checksum, payload = parse_icmp_header(data)
                    print(f"  ICMP: Type={icmp_type} Code={code}")

                else:
                    print(f"  Protocol: {proto} (Unknown)")

            else:
                # Linux: data starts at Ethernet layer
                dest_mac, src_mac, eth_proto, data = parse_ethernet_frame(raw_data)
                print(f"\n[Packet #{packet_count}]")
                print(f"  Ethernet: {src_mac} -> {dest_mac}")

                # Parse network layer
                if eth_proto == 8:  # IPv4
                    ttl, proto, src_ip, dest_ip, data = parse_ipv4_header(data)
                    print(f"  IPv4: {src_ip} -> {dest_ip} (TTL: {ttl})")

                    # Parse transport layer (same as Windows)
                    if proto == 6:  # TCP
                        src_port, dest_port, seq, ack, urg, ack_f, psh, rst, syn, fin, payload = parse_tcp_header(data)
                        flags = f"{'U' if urg else ''}{'A' if ack_f else ''}{'P' if psh else ''}{'R' if rst else ''}{'S' if syn else ''}{'F' if fin else ''}"
                        print(f"  TCP: {src_port} -> {dest_port} (Flags: {flags})")
                        print(f"  Payload: {payload[:50]}...")
                    elif proto == 17:  # UDP
                        src_port, dest_port, length, payload = parse_udp_header(data)
                        print(f"  UDP: {src_port} -> {dest_port} (Length: {length})")
                        print(f"  Payload: {payload[:50]}...")
                    elif proto == 1:  # ICMP
                        icmp_type, code, checksum, payload = parse_icmp_header(data)
                        print(f"  ICMP: Type={icmp_type} Code={code}")

            # Limit to 20 packets for demo
            if packet_count >= 20:
                print("\n[Captured 20 packets - stopping demo]")
                break

    except PermissionError:
        print("ERROR: Administrator/root privileges required!")
        print("Run as: sudo python socket_example.py (Linux)")
        print("Or: Run PowerShell as Administrator (Windows)")
        sys.exit(1)

    except KeyboardInterrupt:
        print("\n\n[Capture stopped by user]")

    except Exception as e:
        print(f"\nERROR: {e}")
        print("Note: Windows raw sockets have limitations.")
        print("For production use, prefer Scapy (see sniffer.py).")

    finally:
        if sys.platform == "win32":
            try:
                conn.ioctl(socket.SIO_RCVALL, socket.RCVALL_OFF)
            except:
                pass
        conn.close()
        print(f"\nTotal packets captured: {packet_count}")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  WHY SCAPY IS BETTER:")
    print("=" * 60)
    print("1. This socket code is 200+ lines for basic parsing")
    print("2. Scapy does all this automatically in 1 line: sniff()")
    print("3. Manual byte parsing is error-prone")
    print("4. Platform-specific quirks (Windows vs Linux)")
    print("5. No built-in protocol support (HTTP, DNS, etc.)")
    print("\nBUT: Understanding sockets helps you appreciate Scapy!")
    print("=" * 60 + "\n")

    main()
