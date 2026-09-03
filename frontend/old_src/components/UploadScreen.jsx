import { useState } from "react";

export default function UploadScreen({ onUpload }) {
  const [documentFile, setDocumentFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  const canSubmit = documentFile && selfieFile;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onUpload(documentFile, selfieFile);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-3xl font-bold tracking-tight">SentinelID</h1>
      <p className="text-slate-400 -mt-4">AI Document Screening for Border Checkpoints</p>

      <div className="flex gap-6">
        {/* Document upload */}
        <label className="border-2 border-dashed border-slate-600 rounded-xl p-10 cursor-pointer hover:border-amber-500 transition-colors group">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setDocumentFile(e.target.files[0] ?? null)}
          />
          <div className="text-center">
            <p className="text-slate-300 font-medium group-hover:text-amber-400 transition-colors">
              {documentFile ? documentFile.name : "Click or drag a document to scan"}
            </p>
            <p className="text-slate-500 text-sm mt-1">Passport, visa, ID, or driving license</p>
          </div>
        </label>

        {/* Selfie upload */}
        <label className="border-2 border-dashed border-slate-600 rounded-xl p-10 cursor-pointer hover:border-amber-500 transition-colors group">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSelfieFile(e.target.files[0] ?? null)}
          />
          <div className="text-center">
            <p className="text-slate-300 font-medium group-hover:text-amber-400 transition-colors">
              {selfieFile ? selfieFile.name : "Click or drag a selfie"}
            </p>
            <p className="text-slate-500 text-sm mt-1">A clear, front-facing photo</p>
          </div>
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="px-8 py-3 rounded-lg bg-amber-500 text-slate-900 font-semibold disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
      >
        Scan Document
      </button>
    </div>
  );
}
