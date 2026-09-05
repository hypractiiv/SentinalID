import Icon from "../ui/Icon";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "layoutGrid" },
  { id: "verify", label: "Verify Identity", icon: "shieldCheck" },
  { id: "history", label: "Verification History", icon: "history" },
  { id: "settings", label: "Settings", icon: "server" },
];

export default function Sidebar({ page, onNavigate, open, onClose, verifyStage }) {
  const content = (
    <div className="flex flex-col h-full bg-slate-800 w-64 shrink-0 border-r border-slate-700/60">
      <div className="px-6 py-5 border-b border-slate-700 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <Icon name="shieldCheck" className="w-4.5 h-4.5 text-slate-900" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="font-bold tracking-tight text-[15px] leading-tight">SentinelID</p>
          <p className="text-[11px] text-slate-500 leading-tight">Document screening</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          const showRunningDot = item.id === "verify" && verifyStage === "processing" && !active;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose?.();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                active
                  ? "bg-amber-500 text-slate-900 shadow-sm shadow-amber-900/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/70"
              }`}
            >
              <Icon name={item.icon} className="w-4.5 h-4.5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1">{item.label}</span>
              {showRunningDot && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"
                  aria-label="Verification in progress"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700 text-[11px] text-slate-600">
        Session-only history · no data persisted
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <div className="hidden md:block">{content}</div>

      {/* Mobile: drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="relative z-50">{content}</div>
        </div>
      )}
    </>
  );
}
