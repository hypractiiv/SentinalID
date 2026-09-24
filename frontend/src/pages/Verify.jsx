import UploadScreen from "../components/verification/UploadScreen";
import ProcessingScreen from "../components/verification/ProcessingScreen";
import ResultsDashboard from "../components/verification/ResultsDashboard";

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
  onUpdateDecision,
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
      {stage === "results" && (
        <ResultsDashboard
          data={result}
          onReset={onReset}
          onUpdateDecision={onUpdateDecision}
        />
      )}
    </div>
  );
}
