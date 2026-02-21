import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AdminWarning from "./pages/AdminWarning";
import Packets from "./pages/Packets";
import Threats from "./pages/Threats";
import Settings from "./pages/Settings";

const THEMES = {
  dark: "dark",
  light: "light"
};

export default function App() {
  const [theme, setTheme] = useState(THEMES.dark);
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settings, setSettings] = useState({
    iface: "",
    emitIntervalMs: "0",
    maxPackets: "200"
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === THEMES.dark) {
      root.classList.add("dark");
      document.body.classList.add("bg-night");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("bg-night");
    }
  }, [theme]);

  return (
    <div className="min-h-screen text-slate-100">
      <Navbar
        theme={theme}
        setTheme={setTheme}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="flex gap-4 px-4 pb-8">
        <Sidebar
          open={sidebarOpen}
          view={view}
          setView={setView}
        />
        <main className="flex-1">
          {view === "dashboard" && <Dashboard settings={settings} />}
          {view === "packets" && <Packets settings={settings} />}
          {view === "threats" && <Threats />}
          {view === "settings" && (
            <Settings settings={settings} setSettings={setSettings} />
          )}
          {view === "warning" && <AdminWarning />}
        </main>
      </div>
    </div>
  );
}
