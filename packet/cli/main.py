"""Interactive network packet sniffer (Windows-friendly).
Run with Administrator privileges to capture packets.
"""

from sniffer import Sniffer
from utils import (
    banner,
    clear_screen,
    color_text,
    prompt_optional_int,
    prompt_optional_ip,
)


def main() -> None:
    sniffer = Sniffer()
    iface = None

    while True:
        clear_screen()
        print(banner())
        print(color_text("Select capture interface:", "cyan"))
        interfaces = Sniffer.list_interfaces()
        for idx, name in enumerate(interfaces, start=1):
            print(f"{idx}. {name}")
        print("0. Use default")

        pick = input("Choose interface number: ").strip()
        if pick == "0" or pick == "":
            iface = None
            break
        if pick.isdigit() and 1 <= int(pick) <= len(interfaces):
            iface = interfaces[int(pick) - 1]
            break
        print(color_text("Invalid selection. Try again.", "red"))
        input("Press Enter to continue...")

    while True:
        print(color_text("\n=== Mini Wireshark CLI ===", "cyan"))
        print("1. Capture all traffic")
        print("2. Capture only TCP")
        print("3. Capture only UDP")
        print("4. Capture only ICMP")
        print("5. Capture HTTP traffic")
        print("6. Stop / Exit")
        choice = input("Select an option: ").strip()

        if choice == "6":
            print("Exiting...")
            break
        if choice not in {"1", "2", "3", "4", "5"}:
            print(color_text("Invalid selection.", "red"))
            continue

        ip_filter = prompt_optional_ip("Filter by IP (press Enter to skip): ")
        port_filter = prompt_optional_int("Filter by Port (press Enter to skip): ")

        save_pcap = input("Save packets to .pcap? (y/n): ").strip().lower() == "y"
        save_log = input("Save packets to .txt log? (y/n): ").strip().lower() == "y"

        try:
            sniffer.start_capture(
                mode=choice,
                ip_filter=ip_filter,
                port_filter=port_filter,
                save_pcap=save_pcap,
                save_log=save_log,
                iface=iface,
            )
        except KeyboardInterrupt:
            sniffer.stop_capture()
        except Exception as exc:
            print(color_text(f"Error: {exc}", "red"))


if __name__ == "__main__":
    main()
