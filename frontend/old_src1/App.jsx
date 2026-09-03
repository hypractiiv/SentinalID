import { useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import History from "./pages/History";
import Settings from "./pages/Settings";

let caseCounter = 100;
function nextCaseId() {
  caseCounter += 1;
  return `VER-${String(caseCounter).padStart(6, "0")}`;
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [history, setHistory] = useState([]);

  const handleVerificationComplete = (result) => {
    const record = {
      ...result,
      id: nextCaseId(),
      timestamp: new Date().toLocaleString(),
    };
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
