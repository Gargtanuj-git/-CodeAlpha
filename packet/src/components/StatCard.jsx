import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${accent || "text-white"}`}>
        {value}
      </p>
    </motion.div>
  );
}
