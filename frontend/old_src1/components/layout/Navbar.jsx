import { useEffect, useState } from "react";
import { pingBackend } from "../../api/verifyDocument";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  verify: "Verify Identity",
  history: "Verification History",
  settings: "Settings",
};

export default function Navbar({ page, onMenuClick }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ok = await pingBackend();
      if (!cancelled) setStatus(ok ? "connected" : "unavailable");
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const statusStyles = {
    checking: { dot: "bg-slate-500", label: "Checking backend…" },
    connected: { dot: "bg-green-400", label: "Backend connected" },
    unavailable: { dot: "bg-red-400", label: "Backend unavailable" },
  };
  const s = statusStyles[status];

  return (
    <div className="h-16 border-b border-slate-700 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-slate-100 p-2 -ml-2"
          aria-label="Open navigation"
        >
          ☰
        </button>
        <h1 className="font-semibold">{PAGE_TITLES[page] ?? ""}</h1>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
        {s.label}
      </div>
    </div>
  );
}
