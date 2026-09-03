import { useState } from "react";

export default function TamperHeatmapCard({ tamper }) {
  const [expanded, setExpanded] = useState(false);
  const isSuspicious = tamper.verdict === "SUSPICIOUS";

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Tampering Analysis</h2>
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${isSuspicious ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"}`}>
          {tamper.verdict}
        </span>
      </div>

      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">Tampering Risk Score</span>
        <span className={isSuspicious ? "text-red-400" : "text-green-400"}>{tamper.tamper_score}/100</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">Heuristic score, not a calibrated fraud probability.</p>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
      >
        {expanded ? "Hide analysis" : "View analysis"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {tamper.ela_output_path && (
            <img
              src={tamper.ela_output_path}
              alt="Error Level Analysis heatmap"
              className={`w-full rounded-lg border-2 ${isSuspicious ? "border-red-500" : "border-green-600"}`}
            />
          )}
          {tamper.metadata_flags?.length > 0 && (
            <div className="space-y-1">
              {tamper.metadata_flags.map((flag, i) => (
                <p key={i} className="text-xs text-amber-400">⚠ {flag}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
