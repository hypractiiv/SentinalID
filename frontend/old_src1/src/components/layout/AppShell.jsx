import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell({ page, onNavigate, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <Sidebar
        page={page}
        onNavigate={onNavigate}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar page={page} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
