import React, { useMemo, useState } from "react";

const columns = [
  { key: "timestamp", label: "Time", className: "hidden lg:table-cell" },
  { key: "protocol", label: "Proto" },
  { key: "src_ip", label: "Source" },
  { key: "dst_ip", label: "Destination" },
  { key: "src_port", label: "Src Port", className: "hidden md:table-cell" },
  { key: "dst_port", label: "Dst Port", className: "hidden md:table-cell" },
  { key: "length", label: "Len", className: "hidden md:table-cell" }
];

export default function PacketTable({ packets, lastPacketId }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return packets.filter((pkt) => {
      const haystack = `${pkt.src_ip} ${pkt.dst_ip} ${pkt.protocol} ${pkt.payload}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [packets, search]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    data.sort((a, b) => {
      const left = a[sortKey] || "";
      const right = b[sortKey] || "";
      if (left < right) return sortDir === "asc" ? -1 : 1;
      if (left > right) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [filtered, sortKey, sortDir]);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Live Packet Feed
          </p>
          <p className="text-xs text-slate-500">Search, sort, and inspect payloads.</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search IP, protocol, payload..."
          className="w-full max-w-xs rounded-xl border border-slate-700/60 bg-black/30 px-3 py-2 text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.3em] text-slate-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className={`cursor-pointer px-2 py-3 ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-3">Payload</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pkt) => (
              <tr
                key={pkt.id}
                className={`border-t border-slate-800/70 hover:bg-slate-800/40 ${
                  pkt.id === lastPacketId ? "packet-new" : ""
                } ${pkt.suspicious ? "text-danger" : "text-slate-200"}`}
              >
                <td className="hidden px-2 py-3 text-xs text-slate-400 lg:table-cell">
                  {pkt.timestamp}
                </td>
                <td className="px-2 py-3 font-semibold">{pkt.protocol}</td>
                <td className="px-2 py-3">{pkt.src_ip}</td>
                <td className="px-2 py-3">{pkt.dst_ip}</td>
                <td className="hidden px-2 py-3 md:table-cell">{pkt.src_port}</td>
                <td className="hidden px-2 py-3 md:table-cell">{pkt.dst_port}</td>
                <td className="hidden px-2 py-3 md:table-cell">{pkt.length}</td>
                <td
                  className="px-2 py-3 text-xs text-slate-400"
                  title={pkt.payload}
                >
                  <span className="block max-w-[240px] truncate">
                    {pkt.payload}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="mt-4 text-xs text-slate-500">No packets captured yet.</p>
        )}
      </div>
    </div>
  );
}
