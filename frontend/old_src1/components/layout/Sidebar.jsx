const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "verify", label: "Verify Identity" },
  { id: "history", label: "Verification History" },
  { id: "settings", label: "Settings" },
];

export default function Sidebar({ page, onNavigate, open, onClose }) {
  const content = (
    <div className="flex flex-col h-full bg-slate-800 w-64 shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <p className="font-bold tracking-tight text-lg">SentinelID</p>
        <p className="text-xs text-slate-500 mt-0.5">Identity document screening</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose?.();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-500 text-slate-900"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
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
