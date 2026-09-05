import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const STAGE_MESSAGES = {
  upload: "",
  processing: "Verification in progress.",
  results: "Verification complete.",
};

export default function AppShell({ page, onNavigate, verifyStage, verifyError, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const announcement = verifyError
    ? `Verification failed: ${verifyError}`
    : STAGE_MESSAGES[verifyStage] ?? "";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Screen-reader-only live region: announces stage changes even
          when the Verify page itself isn't the one on screen. */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      <div className="print:hidden">
        <Sidebar
          page={page}
          onNavigate={onNavigate}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          verifyStage={verifyStage}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden">
          <Navbar
            page={page}
            onMenuClick={() => setDrawerOpen(true)}
            verifyStage={verifyStage}
            onNavigate={onNavigate}
          />
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
