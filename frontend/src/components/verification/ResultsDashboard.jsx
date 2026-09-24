import { useState } from "react";
import RiskGauge from "./RiskGauge";
import OcrFieldsCard from "./OcrFieldsCard";
import TamperHeatmapCard from "./TamperHeatmapCard";
import FaceMatchCard from "./FaceMatchCard";
import LivenessCard from "./LivenessCard";
import VerdictBadge from "./VerdictBadge";
import Icon from "../ui/Icon";
import { generateReportPdf, shareReportPdf } from "../../utils/generateReportPdf";
import { useToast } from "../../context/ToastContext";

const HERO_COPY = {
  LOW: {
    label: "PASS · CLEARED FOR ENTRY",
    tone: "text-emerald-400",
    bg: "bg-emerald-950/60 border-emerald-500/40",
    icon: "checkCircle",
    action: "ALLOW ENTRY",
  },
  MEDIUM: {
    label: "REVIEW · SECONDARY INSPECTION RECOMMENDED",
    tone: "text-amber-400",
    bg: "bg-amber-950/60 border-amber-500/40",
    icon: "alertTriangle",
    action: "SECONDARY INSPECTION",
  },
  HIGH: {
    label: "FAIL · HIGH FRAUD RISK / SPOOF DETECTED",
    tone: "text-red-400",
    bg: "bg-red-950/60 border-red-500/40",
    icon: "x",
    action: "DENY ENTRY / SEIZE CREDENTIAL",
  },
};

const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

export default function ResultsDashboard({ data, onReset, onUpdateDecision }) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [officerDecision, setOfficerDecision] = useState(data.officerDecision || null);
  const [officerNotes, setOfficerNotes] = useState(data.officerNotes || "");
  const [officerBadge, setOfficerBadge] = useState(data.officerBadge || "SSB-7821");
  const [decisionSaved, setDecisionSaved] = useState(Boolean(data.officerDecision));
  const { addToast } = useToast();

  if (!data) return null;

  const riskLevel = data.risk?.risk_level ?? "MEDIUM";
  const hero = HERO_COPY[riskLevel] ?? HERO_COPY.MEDIUM;
  const riskFactors = data.risk?.risk_factors || [];
  const latency = data.telemetry?.processing_time_ms || data.telemetry?.client_roundtrip_ms;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateReportPdf({
        verificationId: data.id,
        timestamp: data.timestamp,
        data: { ...data, officerDecision, officerNotes, officerBadge },
      });
      addToast("Security report downloaded successfully.", "success");
    } catch (err) {
      console.error("PDF generation failed:", err);
      addToast("Couldn't generate the PDF report.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const outcome = await shareReportPdf({
        verificationId: data.id,
        timestamp: data.timestamp,
        data: { ...data, officerDecision, officerNotes, officerBadge },
      });
      if (outcome === "downloaded") {
        addToast("Sharing not supported in this client — downloaded PDF instead.", "info");
      }
    } catch (err) {
      console.error("PDF share failed:", err);
      addToast("Failed to share report.", "error");
    } finally {
      setSharing(false);
    }
  };

  const handleRecordDecision = (action) => {
    setOfficerDecision(action);
    setDecisionSaved(true);
    if (onUpdateDecision) {
      onUpdateDecision(data.id, {
        officerDecision: action,
        officerNotes,
        officerBadge,
      });
    }
    addToast(`Officer decision logged: ${action}`, "success");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar with Case Metadata & Export Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-800/90 border border-slate-700/60 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg font-bold text-slate-100">Screening Intelligence Report</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
            <span>Case ID: {data.id}</span>
            <span>·</span>
            <span>{data.timestamp}</span>
            {latency && (
              <>
                <span>·</span>
                <span className="text-amber-400">Latency: {latency}ms</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium transition-colors border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-amber-400" />
            {downloading ? "Generating PDF…" : "Download Report"}
          </button>

          {canNativeShare && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium transition-colors border border-slate-600"
            >
              <Icon name="share" className="w-3.5 h-3.5 text-cyan-400" />
              Share
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <Icon name="printer" className="w-3.5 h-3.5" />
            Print
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-sm"
          >
            <Icon name="refreshCw" className="w-3.5 h-3.5 text-slate-950" />
            New Screening
          </button>
        </div>
      </div>

      {/* Hero Master Threat Banner */}
      <div
        className={`rounded-2xl p-6 border shadow-md flex flex-col md:flex-row items-center justify-between gap-6 ${hero.bg}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
              riskLevel === "LOW"
                ? "bg-emerald-900/60 border-emerald-500/50 text-emerald-400"
                : riskLevel === "MEDIUM"
                ? "bg-amber-900/60 border-amber-500/50 text-amber-400"
                : "bg-red-900/60 border-red-500/50 text-red-400"
            }`}
          >
            <Icon name={hero.icon} className="w-7 h-7" strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Operational Directive
            </span>
            <h2 className={`text-xl font-black tracking-tight mt-0.5 ${hero.tone}`}>{hero.label}</h2>
            <div className="flex items-center gap-2 mt-1">
              <VerdictBadge level={riskLevel} />
              <span className="text-xs text-slate-300 font-mono">Directive: {hero.action}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <RiskGauge score={data.risk?.final_risk ?? 0} />
        </div>
      </div>

      {/* Flagged Threat Factors (if any) */}
      {riskFactors.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-300 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
            <Icon name="alertTriangle" className="w-4 h-4 text-red-400" />
            Security Anomaly Flags ({riskFactors.length})
          </p>
          <ul className="space-y-1.5">
            {riskFactors.map((factor, i) => (
              <li key={i} className="text-xs text-red-200/90 flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4 Multi-Modal Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OcrFieldsCard
          mrz={data.ocr?.mrz}
          rawText={data.ocr?.raw_text}
          detectedDocType={data.ocr?.detected_doc_type}
        />
        <TamperHeatmapCard tamper={data.tamper} />
        <FaceMatchCard face={data.face} />
        <LivenessCard liveness={data.liveness} />
      </div>

      {/* Border Control Officer Decision Station */}
      <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
            <Icon name="shieldCheck" className="w-4 h-4 text-amber-400" />
            Border Control Officer Action Log
          </h2>
          {decisionSaved && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono flex items-center gap-1">
              <Icon name="check" className="w-3 h-3 text-emerald-400" />
              Recorded in Case Ledger
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Officer Badge ID / Station Code
            </label>
            <input
              type="text"
              value={officerBadge}
              onChange={(e) => setOfficerBadge(e.target.value)}
              placeholder="e.g. SSB-7821 / Raxaul ICP"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Officer Operational Notes
            </label>
            <input
              type="text"
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g. Physical watermarks verified; visual inspection clean."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleRecordDecision("APPROVED")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              officerDecision === "APPROVED"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "bg-slate-700 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700 text-slate-200 border border-slate-600"
            }`}
          >
            <Icon name="userCheck" className="w-3.5 h-3.5" />
            Approve & Clear Traveler
          </button>

          <button
            onClick={() => handleRecordDecision("SECONDARY_INSPECTION")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              officerDecision === "SECONDARY_INSPECTION"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                : "bg-slate-700 hover:bg-amber-950 hover:text-amber-300 hover:border-amber-700 text-slate-200 border border-slate-600"
            }`}
          >
            <Icon name="alertTriangle" className="w-3.5 h-3.5" />
            Escalate to Secondary Inspection
          </button>

          <button
            onClick={() => handleRecordDecision("DENIED_SEIZED")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              officerDecision === "DENIED_SEIZED"
                ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                : "bg-slate-700 hover:bg-red-950 hover:text-red-300 hover:border-red-700 text-slate-200 border border-slate-600"
            }`}
          >
            <Icon name="userX" className="w-3.5 h-3.5" />
            Deny Entry & Seize Credential
          </button>
        </div>
      </div>
    </div>
  );
}
