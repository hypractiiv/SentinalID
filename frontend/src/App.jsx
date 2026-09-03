import { useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { verifyDocument } from "./api/verifyDocument";
import { computeRisk } from "./data/computeRisk";
import { generateCaseId } from "./utils/caseId";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [history, setHistory] = useState([]);

  // Verification state lives HERE, not inside pages/Verify.jsx. App is
  // always mounted; the Verify page is unmounted whenever you navigate to
  // Dashboard/History/Settings. If the in-flight request's stage/result
  // lived in Verify's own state, finishing while you were on another page
  // would call setState on an already-unmounted component — React drops
  // it silently and the result is just gone. Keeping it here means the
  // scan keeps running (and updates this state) no matter which page is
  // showing, and Verify picks up wherever it left off when you return.
  const [verifyStage, setVerifyStage] = useState("upload"); // upload | processing | results
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const startVerification = async (documentFile, selfieFile) => {
    setVerifyStage("processing");
    setVerifyError(null);
    try {
      const apiResult = await verifyDocument(documentFile, selfieFile);
      const risk = computeRisk(apiResult);
      const record = {
        ...apiResult,
        risk,
        id: generateCaseId(),
        timestamp: new Date().toLocaleString(),
      };
      setVerifyResult(record);
      setVerifyStage("results");
      setHistory((prev) => [record, ...prev]);
    } catch (err) {
      console.error(err);
      setVerifyError(err.message);
      setVerifyStage("upload");
    }
  };

  const resetVerification = () => {
    setVerifyStage("upload");
    setVerifyResult(null);
    setVerifyError(null);
  };

  return (
    <AppShell page={page} onNavigate={setPage} verifyStage={verifyStage}>
      {page === "dashboard" && <Dashboard history={history} onNavigate={setPage} />}
      {page === "verify" && (
        <Verify
          stage={verifyStage}
          result={verifyResult}
          error={verifyError}
          onUpload={startVerification}
          onReset={resetVerification}
        />
      )}
      {page === "history" && <History history={history} onNavigate={setPage} />}
      {page === "settings" && <Settings />}
    </AppShell>
  );
}
