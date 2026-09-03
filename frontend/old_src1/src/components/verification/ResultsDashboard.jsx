import { useState } from "react";
import RiskGauge from "./RiskGauge";
import OcrFieldsCard from "./OcrFieldsCard";
import TamperHeatmapCard from "./TamperHeatmapCard";
import FaceMatchCard from "./FaceMatchCard";
import LivenessCard from "./LivenessCard";
import VerdictBadge from "./VerdictBadge";
import { generateReportPdf } from "../../utils/generateReportPdf";

// Presentational-only mapping from the existing HIGH/MEDIUM/LOW risk_level
// (computed by data/computeRisk.js, unchanged) to the PASS/REVIEW/FAIL
// language reviewers scan for. Doesn't touch the underlying data contract.
const heroCopy = {
  LOW: { label: "Passed screening", tone: "text-green-400" },
  MEDIUM: { label: "Manual review recommended", tone: "text-amber-400" },
  HIGH: { label: "Verification failed", tone: "text-red-400" },
};

export default function ResultsDashboard({ data, onReset }) {
  const [downloading, setDownloading] = useState(false);

  if (!data) return null;

  const hero = heroCopy[data.risk.risk_level] ?? heroCopy.MEDIUM;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateReportPdf({ verificationId: data.id, timestamp: data.timestamp, data });
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6 gap-4">
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
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="text-sm px-4 py-2 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            {downloading ? "Generating…" : "Download PDF Report"}
          </button>
          <button
            onClick={onReset}
            className="text-sm text-slate-400 hover:text-amber-400 transition-colors whitespace-nowrap"
          >
            Scan another document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 md:col-span-2 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Overall Risk Assessment</h2>
            <p className={`text-sm font-medium mt-1 ${hero.tone}`}>{hero.label}</p>
            <VerdictBadge level={data.risk.risk_level} />
          </div>
          <RiskGauge score={data.risk.final_risk} />
        </div>

        <OcrFieldsCard mrz={data.ocr.mrz} />
        <TamperHeatmapCard tamper={data.tamper} />
        <FaceMatchCard face={data.face} />
        <LivenessCard />

        {(data.face.doc_face_image || data.face.selfie_face_image) && (
          <div className="bg-slate-800 rounded-xl p-6 md:col-span-2">
            <h2 className="font-semibold text-lg mb-4">Detected Faces</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md">
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
