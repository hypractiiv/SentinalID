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
      </div>
    </div>
  );
}