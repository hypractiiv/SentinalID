import { useState } from "react";
import Icon from "../ui/Icon";

export default function TamperHeatmapCard({ tamper }) {
  const [expanded, setExpanded] = useState(false);
  const isSuspicious = tamper?.verdict === "SUSPICIOUS";
  const isReview = tamper?.verdict === "REVIEW_RECOMMENDED";
  const score = tamper?.tamper_score ?? 0;
  const elaImage = tamper?.ela_image || tamper?.ela_output_path;

  const verdictBadge = isSuspicious
    ? {
        label: "SUSPICIOUS",
        style: "bg-red-950/80 border-red-500/50 text-red-300",
        icon: "alertTriangle",
      }
    : isReview
    ? {
        label: "REVIEW",
        style: "bg-amber-950/80 border-amber-500/50 text-amber-300",
        icon: "alertTriangle",
      }
    : {
        label: "CLEAN",
        style: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
        icon: "checkCircle",
      };

  return (
    <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60 hover:border-slate-600 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-100 flex items-center gap-2">
          <Icon name="shieldCheck" className="w-4 h-4 text-amber-400" />
          Forensic Tamper Detection
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${verdictBadge.style}`}
        >
          <Icon name={verdictBadge.icon} className="w-3.5 h-3.5" />
          {verdictBadge.label}
        </span>
      </div>

      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">Tampering Anomaly Index</span>
        <span
          className={`font-mono font-bold ${
            isSuspicious ? "text-red-400" : isReview ? "text-amber-400" : "text-emerald-400"
          }`}
        >
          {score}/100
        </span>
      </div>

      <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50 mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isSuspicious
              ? "bg-gradient-to-r from-red-600 to-rose-400"
              : isReview
              ? "bg-gradient-to-r from-amber-600 to-amber-400"
              : "bg-gradient-to-r from-emerald-600 to-emerald-400"
          }`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-500 mb-4">
        Calibrated via multi-pass Error Level Analysis (ELA) and high-frequency edge splice noise.
      </p>

      {/* Forensic indicators */}
      {tamper?.forensic_details && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Compression Diff</span>
            <span className="font-mono text-slate-200 font-semibold">
              {tamper.forensic_details.max_compression_diff ?? 0} px
            </span>
          </div>
          <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Splice Noise Risk</span>
            <span className="font-mono text-slate-200 font-semibold">
              {tamper.forensic_details.splice_noise_score ?? 0}%
            </span>
          </div>
        </div>
      )}

      {/* Metadata flags */}
      {tamper?.metadata_flags?.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {tamper.metadata_flags.map((flag, i) => (
            <div
              key={i}
              className="text-xs text-amber-300 bg-amber-950/20 border border-amber-900/40 rounded-lg p-2.5 flex items-start gap-2"
            >
              <Icon name="alertTriangle" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}

      {/* ELA Heatmap Toggle */}
      {elaImage ? (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <Icon name="sparkles" className="w-3.5 h-3.5 text-amber-400" />
            {expanded ? "Hide Error Level Analysis (ELA)" : "Inspect ELA Compression Heatmap"}
          </button>

          {expanded && (
            <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Error Level Analysis Heatmap:</span>
                <span className="text-amber-400 font-mono">Re-compression Delta</span>
              </div>
              <img
                src={elaImage}
                alt="Error Level Analysis heatmap"
                className={`w-full max-h-64 object-contain rounded-lg border-2 ${
                  isSuspicious ? "border-red-500" : isReview ? "border-amber-500" : "border-emerald-600"
                }`}
              />
              <p className="text-[10px] text-slate-500 italic text-center">
                Bright white/colored clusters represent non-uniform compression generations (digital alterations).
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">No ELA heatmap output available for this document.</p>
      )}
    </div>
  );
}
