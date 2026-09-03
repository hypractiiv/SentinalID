import { useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import History from "./pages/History";
import Settings from "./pages/Settings";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [history, setHistory] = useState([]);

  // record already has its id/timestamp attached (see pages/Verify.jsx),
  // so this just needs to file it into session history.
  const handleVerificationComplete = (record) => {
    setHistory((prev) => [record, ...prev]);
  };

  return (
    <AppShell page={page} onNavigate={setPage}>
      {page === "dashboard" && <Dashboard history={history} onNavigate={setPage} />}
      {page === "verify" && <Verify onVerificationComplete={handleVerificationComplete} />}
      {page === "history" && <History history={history} onNavigate={setPage} />}
      {page === "settings" && <Settings />}
    </AppShell>
  );
}
