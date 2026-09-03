export default function TamperHeatmapCard({ tamper }) {
  const isSuspicious = tamper.verdict === "SUSPICIOUS";

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Tampering Analysis</h2>

      {tamper.ela_output_path && (
        <img
          src={tamper.ela_output_path}
          alt="Error Level Analysis heatmap"
          className={`w-full rounded-lg mb-4 border-2 ${isSuspicious ? "border-red-500" : "border-green-600"}`}
        />
      )}

      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-400">Tamper Score</span>
        <span className={isSuspicious ? "text-red-400" : "text-green-400"}>{tamper.tamper_score}/100</span>
      </div>

      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${isSuspicious ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}`}>
        {tamper.verdict}
      </span>

      {tamper.metadata_flags?.length > 0 && (
        <div className="mt-3 space-y-1">
          {tamper.metadata_flags.map((flag, i) => (
            <p key={i} className="text-xs text-amber-400">⚠ {flag}</p>
          ))}
        </div>
      )}
    </div>
  );
}