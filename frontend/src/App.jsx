import { useEffect, useRef, useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { verifyDocument } from "./api/verifyDocument";
import { computeRisk } from "./data/computeRisk";
import { generateCaseId } from "./utils/caseId";
import { useToast } from "./context/ToastContext";

const STORAGE_KEY = "sentinelid_history_ledger";

function loadInitialHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [history, setHistory] = useState(loadInitialHistory);
  const { addToast } = useToast();

  const [documentFile, setDocumentFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [verifyStage, setVerifyStage] = useState("upload"); // upload | processing | results
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  // Stable epoch for the processing timer — lives in App so it survives tab switches.
  const [processingStartMs, setProcessingStartMs] = useState(null);
  const controllerRef = useRef(null);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn("Could not save history to localStorage", e);
    }
  }, [history]);

  const startVerification = async () => {
    if (!documentFile || !selfieFile) return;
    const controller = new AbortController();
    controllerRef.current = controller;

    setProcessingStartMs(Date.now());
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
      setProcessingStartMs(null);
      setHistory((prev) => [record, ...prev]);
      addToast(
        `Verification ${record.id} complete — ${risk.risk_level} risk (${risk.verdict_action || "ALLOW"}).`,
        "success"
      );
    } catch (err) {
      if (err.name === "AbortError") {
        setVerifyStage("upload");
        setProcessingStartMs(null);
        addToast("Verification cancelled.", "warning");
        return;
      }
      console.error(err);
      setVerifyError(err.message);
      setVerifyStage("upload");
      setProcessingStartMs(null);
      addToast(err.message, "error");
    } finally {
      controllerRef.current = null;
    }
  };

  const cancelVerification = () => {
    controllerRef.current?.abort();
  };

  const resetVerification = () => {
    setVerifyStage("upload");
    setVerifyResult(null);
    setVerifyError(null);
    setDocumentFile(null);
    setSelfieFile(null);
    setProcessingStartMs(null);
  };

  const handleUpdateDecision = (caseId, decisionData) => {
    setHistory((prev) =>
      prev.map((rec) => (rec.id === caseId ? { ...rec, ...decisionData } : rec))
    );
    if (verifyResult?.id === caseId) {
      setVerifyResult((prev) => ({ ...prev, ...decisionData }));
    }
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
          onUpdateDecision={handleUpdateDecision}
        />
      )}
      {page === "history" && (
        <History
          history={history}
          onNavigate={setPage}
          onUpdateDecision={handleUpdateDecision}
        />
      )}
      {page === "settings" && <Settings />}
    </AppShell>
  );
}
