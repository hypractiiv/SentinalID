import UploadScreen from "../components/verification/UploadScreen";
import ProcessingScreen from "../components/verification/ProcessingScreen";
import ResultsDashboard from "../components/verification/ResultsDashboard";

// Deliberately stateless. The actual stage/result/error live in App.jsx
// so an in-progress or completed scan survives you navigating to another
// section and back — see the comment above startVerification in App.jsx.
export default function Verify({ stage, result, error, onUpload, onReset }) {
  return (
    <div>
      {stage === "upload" && (
        <>
          <UploadScreen onUpload={onUpload} />
          {error && <p className="text-center text-red-400 -mt-4">{error}</p>}
        </>
      )}
      {stage === "processing" && <ProcessingScreen />}
      {stage === "results" && <ResultsDashboard data={result} onReset={onReset} />}
    </div>
  );
}
