import { useEffect, useRef, useState } from "react";
import CameraCapture from "./CameraCapture";
import Icon from "../ui/Icon";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file, acceptedTypes) {
  if (!file) return null;
  if (!acceptedTypes.includes(file.type)) return "Unsupported file type.";
  if (file.size > MAX_FILE_SIZE) return "File is too large (max 10MB).";
  return null;
}

function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
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
        className={`relative border-2 border-dashed rounded-xl w-full h-36 flex items-center justify-center cursor-pointer transition-all overflow-hidden group focus-within:ring-2 focus-within:ring-amber-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 ${
          dragOver
            ? "border-amber-500 bg-amber-500/5 scale-[1.02]"
            : file
            ? "border-slate-600"
            : "border-slate-600 hover:border-amber-500 hover:bg-slate-800/60"
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
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white transition-opacity gap-1.5">
              <Icon name="upload" className="w-3.5 h-3.5" />
              Replace
            </div>
          </>
        ) : file ? (
          <div className="text-center px-4">
            <Icon name="document" className="w-6 h-6 mx-auto mb-1 text-slate-400" />
            <p className="text-slate-300 text-xs break-all">{file.name}</p>
          </div>
        ) : (
          <div className="text-center px-4">
            <Icon name={icon} className="w-6 h-6 mx-auto mb-2 text-slate-500 group-hover:text-amber-400 transition-colors" />
            <p className="text-slate-300 font-medium group-hover:text-amber-400 transition-colors text-sm">
              {prompt}
            </p>
            <p className="text-slate-500 text-xs mt-1">{hint}</p>
          </div>
        )}
      </label>
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <Icon name="alertTriangle" className="w-3 h-3" />
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
  const [selfieMode, setSelfieMode] = useState("upload"); // "upload" | "camera"

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
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-6">
        <div className="inline-flex w-12 h-12 rounded-xl bg-amber-500/10 items-center justify-center mb-3">
          <Icon name="shieldCheck" className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Identity</h1>
        <p className="text-slate-400 mt-1 text-sm">Upload an ID document and a selfie to start a screening.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
        {error && (
          <div className="border border-red-800 bg-red-950/40 rounded-lg px-4 py-3 text-sm text-red-300 flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <Icon name="alertTriangle" className="w-4 h-4 shrink-0" />
              {error}
            </span>
            <button
              onClick={onSubmit}
              className="shrink-0 px-3 py-1.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-700 text-[10px] flex items-center justify-center">1</span>
              Identity document
            </p>
            <Dropzone
              file={documentFile}
              previewUrl={docPreview}
              onFile={handleDocFile}
              accept={DOC_TYPES}
              icon="document"
              prompt="Click or drag a document"
              hint="Passport, visa, ID, or license"
              error={docError}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-700 text-[10px] flex items-center justify-center">2</span>
                Selfie
              </p>
              <div className="flex gap-0.5 text-[11px] bg-slate-900 rounded-full p-0.5">
                <button
                  onClick={() => setSelfieMode("upload")}
                  className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                    selfieMode === "upload" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  <Icon name="upload" className="w-3 h-3" />
                  Upload
                </button>
                <button
                  onClick={() => setSelfieMode("camera")}
                  className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                    selfieMode === "camera" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  <Icon name="camera" className="w-3 h-3" />
                  Camera
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
                prompt="Click or drag a selfie"
                hint="A clear, front-facing photo"
                error={selfieError}
              />
            )}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-amber-500 text-slate-900 font-semibold disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all hover:enabled:bg-amber-400 hover:enabled:shadow-lg hover:enabled:shadow-amber-900/30 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          <Icon name="shieldCheck" className="w-4 h-4" />
          Start Verification
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center mt-4">
        Files are sent directly to the local verification backend for this session and aren't kept anywhere else in this app.
      </p>
    </div>
  );
}
