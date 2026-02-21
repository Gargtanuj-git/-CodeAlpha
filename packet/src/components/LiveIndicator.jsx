import React from "react";

export default function LiveIndicator({ active }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
      <span
        className={`h-2 w-2 rounded-full ${
          active ? "bg-accent blink" : "bg-slate-600"
        }`}
      ></span>
      <span className={active ? "text-accent" : "text-slate-400"}>
        {active ? "Capturing" : "Idle"}
      </span>
    </div>
  );
}
