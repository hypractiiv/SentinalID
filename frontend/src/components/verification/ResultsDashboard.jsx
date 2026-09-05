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

// Presentational-only mapping from the existing HIGH/MEDIUM/LOW risk_level
// (computed by data/computeRisk.js, unchanged) to the PASS/REVIEW/FAIL
// language reviewers scan for. Doesn't touch the underlying data contract.
const heroCopy = {
  LOW: { label: "Passed screening", tone: "text-green-400", icon: "checkCircle" },
  MEDIUM: { label: "Manual review recommended", tone: "text-amber-400", icon: "alertTriangle" },
  HIGH: { label: "Verification failed", tone: "text-red-400", icon: "x" },
};

const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

export default function ResultsDashboard({ data, onReset }) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { addToast } = useToast();

  if (!data) return null;

  const hero = heroCopy[data.risk.risk_level] ?? heroCopy.MEDIUM;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateReportPdf({ verificationId: data.id, timestamp: data.timestamp, data });
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      addToast("Couldn't generate the PDF report.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const outcome = await shareReportPdf({ verificationId: data.id, timestamp: data.timestamp, data });
      if (outcome === "downloaded") {
        addToast("Sharing isn't supported here — downloaded the report instead.", "info");
      }
    } catch (err) {
      console.error("Failed to share PDF report:", err);
      addToast("Couldn't share the report.", "error");
    } finally {
      setSharing(false);
    }
  };

  const cardClasses =
    "bg-slate-800 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-colors";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold">Screening Report</h1>
          {(data.id || data.timestamp) && (
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {data.id && <span>{data.id}</span>}
              {data.id && data.timestamp && <span className="mx-2">·</span>}
              {data.timestamp && <span>{data.timestamp}</span>}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Icon name="download" className="w-4 h-4" />
            {downloading ? "Generating…" : "Download PDF"}
          </button>
          {canNativeShare && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Icon name="share" className="w-4 h-4" />
              {sharing ? "Preparing…" : "Share"}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Icon name="printer" className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={onReset}
            className="text-sm text-slate-400 hover:text-amber-400 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
          >
            Scan another document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`${cardClasses} lg:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-6`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                data.risk.risk_level === "LOW"
                  ? "bg-green-900"
                  : data.risk.risk_level === "MEDIUM"
                  ? "bg-amber-900"
                  : "bg-red-900"
              }`}
            >
              <Icon name={hero.icon} className={`w-7 h-7 ${hero.tone}`} strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Overall Risk Assessment</h2>
              <p className={`text-sm font-medium mt-0.5 ${hero.tone}`}>{hero.label}</p>
              <VerdictBadge level={data.risk.risk_level} />
            </div>
          </div>
          <RiskGauge score={data.risk.final_risk} />
        </div>

        <OcrFieldsCard mrz={data.ocr.mrz} />
        <TamperHeatmapCard tamper={data.tamper} />
        <FaceMatchCard face={data.face} />
        <div className="lg:col-span-2">
          <LivenessCard />
        </div>

        {(data.face.doc_face_image || data.face.selfie_face_image) && (
          <div className={`${cardClasses} lg:col-span-1`}>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Icon name="users" className="w-4 h-4 text-slate-400" />
              Detected Faces
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {data.face.doc_face_image && (
                <div>
                  <img
                    src={`data:image/jpeg;base64,${data.face.doc_face_image}`}
                    alt="Face detected on document"
                    className="rounded-lg w-full object-cover"
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">Document</p>
                </div>
              )}
              {data.face.selfie_face_image && (
                <div>
                  <img
                    src={`data:image/jpeg;base64,${data.face.selfie_face_image}`}
                    alt="Face detected in selfie"
                    className="rounded-lg w-full object-cover"
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">Selfie</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
