import React from "react";

export default function Spinner() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent"></span>
      Loading
    </div>
  );
}
