import { useState } from "react";
import Icon from "../ui/Icon";

export default function LivenessCard({ liveness }) {
  const [showScanModal, setShowScanModal] = useState(false);

  if (!liveness) {
    return (
      <div className="bg-slate-800/90 rounded-xl p-6 border border-dashed border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-300 flex items-center gap-2">
            <Icon name="eye" className="w-4 h-4 text-slate-500" />
            Liveness Check (PAD)
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-400">
            <Icon name="clock" className="w-3 h-3" />
            NOT EVALUATED
          </span>
        </div>
        <p className="text-xs text-slate-500">
          No live biometric telemetry available for this case.
        </p>
      </div>
    );
  }

  const isLive = liveness.is_live;
  const score = liveness.liveness_score ?? 0;
  const verdict = liveness.verdict || (isLive ? "GENUINE_LIVE" : "PRESENTATION_ATTACK");

  const badgeConfig = {
    GENUINE_LIVE: {
      label: "GENUINE LIVE",
      bg: "bg-emerald-950/80 border-emerald-500/40 text-emerald-300",
      icon: "checkCircle",
    },
    SUSPECTED_SPOOF: {
      label: "BORDERLINE SPOOF",
      bg: "bg-amber-950/80 border-amber-500/40 text-amber-300",
      icon: "alertTriangle",
    },
    PRESENTATION_ATTACK: {
      label: "PRESENTATION ATTACK",
      bg: "bg-red-950/80 border-red-500/40 text-red-300",
      icon: "alertTriangle",
    },
  };

  const badge = badgeConfig[verdict] || badgeConfig.SUSPECTED_SPOOF;

  const checks = liveness.checks || {};
  const checkItems = [
    {
      title: "Display Moiré (2D FFT)",
      desc: checks.screen_moire?.passed ? "No screen pixel grid" : "Screen refresh grid detected",
      passed: checks.screen_moire?.passed ?? true,
    },
    {
      title: "Micro-Texture Porosity",
      desc: checks.micro_texture?.passed ? "Natural skin texture" : "Flat / low-resolution print",
      passed: checks.micro_texture?.passed ?? true,
    },
    {
      title: "Chrominance Gamut",
      desc: checks.color_naturalness?.passed ? "Natural human chroma" : "Unnatural backlight / gamut",
      passed: checks.color_naturalness?.passed ?? true,
    },
    {
      title: "3D Surface Reflectance",
      desc: checks.depth_reflectance?.passed ? "Volumetric 3D curvature" : "Planar 2D glare / reflection",
      passed: checks.depth_reflectance?.passed ?? true,
    },
  ];

  return (
    <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/60 hover:border-slate-600 transition-all shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold text-slate-100 flex items-center gap-2">
          <Icon name="eye" className="w-4 h-4 text-cyan-400" />
          Biometric Liveness & Anti-Spoof
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
        >
          <Icon name={badge.icon} className="w-3.5 h-3.5" />
          {badge.label}
        </span>
      </div>

      {/* Liveness confidence meter */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400">Liveness Confidence Score</span>
          <span className={`font-mono font-bold ${isLive ? "text-emerald-400" : "text-red-400"}`}>
            {score}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isLive ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-red-600 to-rose-400"
            }`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>

      {/* Diagnostic breakdown checklist */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {checkItems.map((item, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
              item.passed
                ? "bg-slate-900/40 border-slate-700/60 text-slate-300"
                : "bg-red-950/20 border-red-900/50 text-red-300"
            }`}
          >
            <div className="flex items-center justify-between font-medium">
              <span>{item.title}</span>
              <Icon
                name={item.passed ? "checkCircle" : "x"}
                className={`w-3.5 h-3.5 ${item.passed ? "text-emerald-400" : "text-red-400"}`}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {liveness.reason && (
        <p className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 leading-relaxed mb-3">
          <span className="font-semibold text-slate-300">Biometric Analysis: </span>
          {liveness.reason}
        </p>
      )}

      {/* Button to view HUD scan */}
      {liveness.liveness_annotated_image && (
        <div>
          <button
            onClick={() => setShowScanModal(!showScanModal)}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <Icon name="zoomIn" className="w-3.5 h-3.5 text-cyan-400" />
            {showScanModal ? "Hide Biometric HUD Overlay" : "Inspect Biometric HUD Scan"}
          </button>

          {showScanModal && (
            <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-cyan-500/30">
              <p className="text-[11px] text-cyan-300 mb-2 font-mono flex items-center gap-1.5">
                <Icon name="sparkles" className="w-3 h-3" />
                HUD Facial Coordinate & Target Reticle Scan:
              </p>
              <img
                src={liveness.liveness_annotated_image}
                alt="Biometric liveness HUD scan"
                className="w-full max-h-72 object-contain rounded-lg border border-slate-700"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
