export default function UploadScreen({ onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-3xl font-bold tracking-tight">SentinelID</h1>
      <p className="text-slate-400 -mt-4">AI Document Screening for Border Checkpoints</p>
      <label className="border-2 border-dashed border-slate-600 rounded-xl p-16 cursor-pointer hover:border-amber-500 transition-colors group">
        <input type="file" accept="image/*,video/*" className="hidden" onChange={onUpload} />
        <div className="text-center">
          <p className="text-slate-300 font-medium group-hover:text-amber-400 transition-colors">
            Click or drag a document to scan
          </p>
          <p className="text-slate-500 text-sm mt-1">Passport, visa, ID, or driving license</p>
        </div>
      </label>
    </div>
  );
}