import { useEffect, useState } from "react";
import { pingBackend } from "../../api/verifyDocument";
import Icon from "../ui/Icon";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  verify: "Verify Identity",
  history: "Verification History",
  settings: "Settings",
};

export default function Navbar({ page, onMenuClick, verifyStage, onNavigate }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const res = await pingBackend();
      const isOk = typeof res === "object" ? Boolean(res?.ok) : Boolean(res);
      if (!cancelled) setStatus(isOk ? "connected" : "unavailable");
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // "connected" and "checking" pulsate (something is actively live/in
  // progress); "unavailable" stays solid red — a steady dot reads as a
  // stopped/alert state, a pulsing one reads as "still working".
  const statusStyles = {
    checking: { dot: "bg-slate-500 animate-pulse", label: "Checking backend…" },
    connected: { dot: "bg-green-400 animate-pulse", label: "Backend connected" },
    unavailable: { dot: "bg-red-400", label: "Backend unavailable" },
  };
  const s = statusStyles[status];

  // Runs regardless of which page is showing (see App.jsx) — this just
  // surfaces that fact when you're not looking at the Verify page.
  const showRunningBadge = verifyStage === "processing" && page !== "verify";

  return (
    <div className="h-16 border-b border-slate-700 flex items-center justify-between px-4 md:px-8 bg-slate-900/60 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-slate-100 p-2 -ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
          aria-label="Open navigation"
        >
          ☰
        </button>
        <h1 className="font-semibold">{PAGE_TITLES[page] ?? ""}</h1>
      </div>

      <div className="flex items-center gap-4">
        {showRunningBadge && (
          <button
            onClick={() => onNavigate("verify")}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Verification running…
          </button>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-400 pl-3 border-l border-slate-700">
          <Icon name="server" className="w-3.5 h-3.5 hidden sm:block" />
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className="hidden sm:inline">{s.label}</span>
        </div>
      </div>
    </div>
  );
}
