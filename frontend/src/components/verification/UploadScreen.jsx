import { useEffect, useState } from "react";
import CameraCapture from "./CameraCapture";
import Icon from "../ui/Icon";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file, acceptedTypes) {
  if (!file) return null;
  if (!acceptedTypes.includes(file.type)) {
    return "Unsupported file type. Please upload a JPEG, PNG, WebP or PDF.";
  }
  if (file.size > MAX_FILE_SIZE) return "File exceeds maximum size (max 15MB).";
  return null;
}

function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (file && file.type?.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setUrl(null);
  }, [file]);
  return url;
}

function Dropzone({ file, previewUrl, onFile, accept, icon, prompt, hint, error }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const picked = fileList?.[0];
    if (picked) onFile(picked);
  };

  const isPdf = file?.type === "application/pdf";

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative border-2 border-dashed rounded-xl w-full h-44 flex items-center justify-center cursor-pointer transition-all overflow-hidden group focus-within:ring-2 focus-within:ring-amber-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 ${
          dragOver
            ? "border-amber-400 bg-amber-500/10 scale-[1.01]"
            : file
            ? "border-slate-600 bg-slate-900/60"
            : "border-slate-700 bg-slate-900/40 hover:border-amber-500/70 hover:bg-slate-800/60"
        }`}
      >
        <input
          type="file"
          accept={accept.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Selected preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white transition-opacity gap-1.5 backdrop-blur-[2px]">
              <Icon name="upload" className="w-4 h-4 text-amber-400" />
              Replace Document
            </div>
          </>
        ) : isPdf ? (
          <div className="text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center mx-auto mb-2 text-red-400">
              <Icon name="document" className="w-6 h-6" />
            </div>
            <p className="text-slate-200 text-xs font-semibold break-all">{file.name}</p>
            <p className="text-slate-400 text-[11px] mt-0.5">PDF Document (Page 1 auto-extracted)</p>
          </div>
        ) : file ? (
          <div className="text-center px-4">
            <Icon name="document" className="w-7 h-7 mx-auto mb-1 text-slate-400" />
            <p className="text-slate-300 text-xs font-mono break-all">{file.name}</p>
          </div>
        ) : (
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-2.5 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors">
              <Icon name={icon} className="w-5 h-5" />
            </div>
            <p className="text-slate-200 font-semibold group-hover:text-amber-400 transition-colors text-sm">
              {prompt}
            </p>
            <p className="text-slate-500 text-xs mt-1">{hint}</p>
          </div>
        )}
      </label>
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1 mt-0.5">
          <Icon name="alertTriangle" className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function UploadScreen({
  documentFile,
  selfieFile,
  onDocumentChange,
  onSelfieChange,
  onSubmit,
  error,
}) {
  const [docError, setDocError] = useState(null);
  const [selfieError, setSelfieError] = useState(null);
  const [selfieMode, setSelfieMode] = useState("upload");

  const docPreview = useObjectUrl(documentFile);
  const selfiePreview = useObjectUrl(selfieFile);

  const handleDocFile = (file) => {
    const err = validateFile(file, DOC_TYPES);
    setDocError(err);
    if (!err) onDocumentChange(file);
  };

  const handleSelfieFile = (file) => {
    const err = validateFile(file, SELFIE_TYPES);
    setSelfieError(err);
    if (!err) onSelfieChange(file);
  };

  const canSubmit = documentFile && selfieFile && !docError && !selfieError;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center mb-3 shadow-lg shadow-amber-500/5">
          <Icon name="shieldCheck" className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Identity Document & Biometric Screening
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm max-w-lg mx-auto leading-relaxed">
          Submit traveler credentials and live facial biometrics to execute real-time multi-modal fraud detection.
        </p>
      </div>

      {/* Main Intake Panel */}
      <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-6 space-y-6 shadow-md">
        {error && (
          <div className="border border-red-800/70 bg-red-950/40 rounded-xl px-4 py-3.5 text-xs text-red-300 flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <Icon name="alertTriangle" className="w-4 h-4 shrink-0 text-red-400" />
              {error}
            </span>
            <button
              onClick={onSubmit}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
            >
              Retry Screening
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Bay 1: Identity Document */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold border border-amber-500/30">
                  1
                </span>
                Identity Document (ID / Passport / PDF)
              </p>
            </div>
            <Dropzone
              file={documentFile}
              previewUrl={docPreview}
              onFile={handleDocFile}
              accept={DOC_TYPES}
              icon="document"
              prompt="Upload ID Document"
              hint="Passport, National ID Card, Visa, or Driving Permit"
              error={docError}
            />
          </div>

          {/* Bay 2: Live Biometric Capture */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold border border-amber-500/30">
                  2
                </span>
                Live Face Biometric
              </p>
              <div className="flex gap-0.5 text-xs bg-slate-900/80 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setSelfieMode("upload")}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${
                    selfieMode === "upload"
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon name="upload" className="w-3 h-3" />
                  Upload
                </button>
                <button
                  onClick={() => setSelfieMode("camera")}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${
                    selfieMode === "camera"
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon name="camera" className="w-3 h-3" />
                  Live Camera
                </button>
              </div>
            </div>

            {selfieMode === "camera" ? (
              <CameraCapture
                onCapture={(file) => {
                  handleSelfieFile(file);
                  setSelfieMode("upload");
                }}
                onClose={() => setSelfieMode("upload")}
              />
            ) : (
              <Dropzone
                file={selfieFile}
                previewUrl={selfiePreview}
                onFile={handleSelfieFile}
                accept={SELFIE_TYPES}
                icon="camera"
                prompt="Upload Live Selfie"
                hint="Front-facing portrait under standard illumination"
                error={selfieError}
              />
            )}
          </div>
        </div>

        {/* Submit Execution Action */}
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:enabled:shadow-lg hover:enabled:shadow-amber-500/20 active:enabled:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Icon name="shieldCheck" className="w-5 h-5 text-slate-950" strokeWidth={2.2} />
          Execute SentinelID Screening Pipeline
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Icon name="lock" className="w-3 h-3 text-slate-400" />
          Local Ephemeral Processing
        </span>
        <span>·</span>
        <span>Zero Permanent Storage</span>
        <span>·</span>
        <span>ICAO 9303 & ISO/IEC 30107-3 Standard Compliant</span>
      </div>
    </div>
  );
}
