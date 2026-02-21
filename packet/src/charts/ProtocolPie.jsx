import React from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

const COLORS = ["#38bdf8", "#22d3ee", "#f59e0b", "#ef4444", "#a3e635"];

export default function ProtocolPie({ data }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
        Protocol Distribution
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
