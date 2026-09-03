import { useState } from "react";
import UploadScreen from "../components/verification/UploadScreen";
import ProcessingScreen from "../components/verification/ProcessingScreen";
import ResultsDashboard from "../components/verification/ResultsDashboard";
import { verifyDocument } from "../api/verifyDocument";
import { computeRisk } from "../data/computeRisk";
import { generateCaseId } from "../utils/caseId";

export default function Verify({ onVerificationComplete }) {
  const [stage, setStage] = useState("upload");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (documentFile, selfieFile) => {
    setStage("processing");
    setError(null);
    try {
      const apiResult = await verifyDocument(documentFile, selfieFile);
      const risk = computeRisk(apiResult);
      // id/timestamp are generated once here, at the moment the result
      // exists, so the same values show up whether you're looking at the
      // live report or reopening it later from History.
      const record = {
        ...apiResult,
        risk,
        id: generateCaseId(),
        timestamp: new Date().toLocaleString(),
      };
      setResult(record);
      setStage("results");
      onVerificationComplete?.(record);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStage("upload");
    }
  };

  const handleReset = () => {
    setStage("upload");
    setResult(null);
    setError(null);
  };

  return (
    <div>
      {stage === "upload" && (
        <>
          <UploadScreen onUpload={handleUpload} />
          {error && <p className="text-center text-red-400 -mt-4">{error}</p>}
        </>
      )}
      {stage === "processing" && <ProcessingScreen />}
      {stage === "results" && <ResultsDashboard data={result} onReset={handleReset} />}
    </div>
  );
}
