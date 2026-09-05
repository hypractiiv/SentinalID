import UploadScreen from "../components/verification/UploadScreen";
import ProcessingScreen from "../components/verification/ProcessingScreen";
import ResultsDashboard from "../components/verification/ResultsDashboard";

// Deliberately stateless. The actual stage/result/error/files live in
// App.jsx so an in-progress or completed scan survives you navigating to
// another section and back — see the comment above startVerification in
// App.jsx.
export default function Verify({
  stage,
  result,
  error,
  documentFile,
  selfieFile,
  onDocumentChange,
  onSelfieChange,
  onSubmit,
  onCancel,
  onReset,
}) {
  return (
    <div>
      {stage === "upload" && (
        <UploadScreen
          documentFile={documentFile}
          selfieFile={selfieFile}
          onDocumentChange={onDocumentChange}
          onSelfieChange={onSelfieChange}
          onSubmit={onSubmit}
          error={error}
        />
      )}
      {stage === "processing" && <ProcessingScreen onCancel={onCancel} />}
      {stage === "results" && <ResultsDashboard data={result} onReset={onReset} />}
    </div>
  );
}
