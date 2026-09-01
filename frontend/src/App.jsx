import { useState } from "react";
import UploadScreen from "./components/UploadScreen";
import ProcessingScreen from "./components/ProcessingScreen";
import ResultsDashboard from "./components/ResultsDashboard";
import { mockResult } from "./data/mockData";
import { computeRisk } from "./data/computeRisk";

export default function App() {
  const [stage, setStage] = useState("upload");
  const [result, setResult] = useState(null);

  const handleUpload = () => {
    setStage("processing");
    setTimeout(() => {
      const risk = computeRisk(mockResult);
      setResult({ ...mockResult, risk });
      setStage("results");
    }, 2000);
  };

  const handleReset = () => {
    setStage("upload");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {stage === "upload" && <UploadScreen onUpload={handleUpload} />}
      {stage === "processing" && <ProcessingScreen />}
      {stage === "results" && <ResultsDashboard data={result} onReset={handleReset} />}
    </div>
  );
}