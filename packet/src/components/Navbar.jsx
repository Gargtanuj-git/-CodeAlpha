import React from "react";

export default function Navbar({ theme, setTheme, onToggleSidebar }) {
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <header className="sticky top-0 z-20 mb-4 w-full border-b border-slate-800/60 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg border border-slate-700/60 px-3 py-1 text-xs uppercase tracking-widest hover:border-accent"
          >
            Menu
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Network Security
            </p>
            <h1 className="text-lg font-semibold text-white">
              Traffic Analyzer Dashboard
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-full border border-slate-700/60 px-3 py-1 text-xs uppercase tracking-widest hover:border-accent"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
            Windows Ready
          </span>
        </div>
      </div>
    </header>
  );
}
