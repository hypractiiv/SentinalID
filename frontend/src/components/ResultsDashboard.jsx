import RiskGauge from "./RiskGauge";
import OcrFieldsCard from "./OcrFieldsCard";
import TamperHeatmapCard from "./TamperHeatmapCard";
import FaceMatchCard from "./FaceMatchCard";
import VerdictBadge from "./VerdictBadge";

export default function ResultsDashboard({ data, onReset }) {
  if (!data) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Screening Report</h1>
        <button
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
        >
          Scan another document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 md:col-span-2 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Overall Risk Assessment</h2>
            <VerdictBadge level={data.risk.risk_level} />
          </div>
          <RiskGauge score={data.risk.final_risk} />
        </div>

        <OcrFieldsCard mrz={data.ocr.mrz} />
        <TamperHeatmapCard tamper={data.tamper} />
        <FaceMatchCard face={data.face} />

        {(data.face.doc_face_image || data.face.selfie_face_image) && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Detected Faces</h2>
            <div className="grid grid-cols-2 gap-4">
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
