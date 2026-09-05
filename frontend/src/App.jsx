import { useRef, useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { verifyDocument } from "./api/verifyDocument";
import { computeRisk } from "./data/computeRisk";
import { generateCaseId } from "./utils/caseId";
import { useToast } from "./context/ToastContext";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [history, setHistory] = useState([]);
  const { addToast } = useToast();

  // Verification state lives HERE, not inside pages/Verify.jsx. App is
  // always mounted; the Verify page is unmounted whenever you navigate to
  // Dashboard/History/Settings. Keeping stage/result/error/files here
  // means: (a) a scan keeps running and its result lands no matter which
  // page you're on, and (b) if a scan fails, the previously-selected
  // files are still here — "Try Again" doesn't require re-picking them.
  const [documentFile, setDocumentFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [verifyStage, setVerifyStage] = useState("upload"); // upload | processing | results
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const controllerRef = useRef(null);

  const startVerification = async () => {
    if (!documentFile || !selfieFile) return;
    const controller = new AbortController();
    controllerRef.current = controller;

    setVerifyStage("processing");
    setVerifyError(null);
    try {
      const apiResult = await verifyDocument(documentFile, selfieFile, controller.signal);
      const risk = computeRisk(apiResult);
      const now = new Date();
      const record = {
        ...apiResult,
        risk,
        id: generateCaseId(),
        timestamp: now.toLocaleString(),
        timestampMs: now.getTime(),
      };
      setVerifyResult(record);
      setVerifyStage("results");
      setHistory((prev) => [record, ...prev]);
      addToast(`Verification ${record.id} complete — ${risk.risk_level} risk.`, "success");
    } catch (err) {
      if (err.name === "AbortError") {
        setVerifyStage("upload");
        addToast("Verification cancelled.", "warning");
        return;
      }
      console.error(err);
      setVerifyError(err.message);
      setVerifyStage("upload");
      addToast(err.message, "error");
    } finally {
      controllerRef.current = null;
    }
  };

  const cancelVerification = () => {
    controllerRef.current?.abort();
  };

  // Used by "Scan another document" on the results page — clears
  // everything, unlike an error retry which deliberately keeps the files.
  const resetVerification = () => {
    setVerifyStage("upload");
    setVerifyResult(null);
    setVerifyError(null);
    setDocumentFile(null);
    setSelfieFile(null);
  };

  return (
    <AppShell page={page} onNavigate={setPage} verifyStage={verifyStage} verifyError={verifyError}>
      {page === "dashboard" && <Dashboard history={history} onNavigate={setPage} />}
      {page === "verify" && (
        <Verify
          stage={verifyStage}
          result={verifyResult}
          error={verifyError}
          documentFile={documentFile}
          selfieFile={selfieFile}
          onDocumentChange={setDocumentFile}
          onSelfieChange={setSelfieFile}
          onSubmit={startVerification}
          onCancel={cancelVerification}
          onReset={resetVerification}
        />
      )}
      {page === "history" && <History history={history} onNavigate={setPage} />}
      {page === "settings" && <Settings />}
    </AppShell>
  );
}
