import { useState } from "react";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResultsDashboard from "../components/verification/ResultsDashboard";

const VERDICT_TONE = { LOW: "PASS", MEDIUM: "REVIEW", HIGH: "FAIL" };

export default function History({ history, onNavigate }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-slate-400 hover:text-amber-400 transition-colors mb-6"
        >
          ← Back to history
        </button>
        <ResultsDashboard data={selected} onReset={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Verification History</h1>
      <p className="text-slate-400 text-sm mb-6">Cases screened during this session</p>

      <div className="bg-slate-800 rounded-xl p-6">
        {history.length === 0 ? (
          <EmptyState
            title="No history yet"
            description="Completed verifications from this session will appear here for review."
            actionLabel="Start Verification"
            onAction={() => onNavigate("verify")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-700">
                  <th className="py-2 pr-4 font-medium">Verification ID</th>
                  <th className="py-2 pr-4 font-medium">Timestamp</th>
                  <th className="py-2 pr-4 font-medium">OCR</th>
                  <th className="py-2 pr-4 font-medium">Tampering</th>
                  <th className="py-2 pr-4 font-medium">Face</th>
                  <th className="py-2 pr-4 font-medium">Overall</th>
                  <th className="py-2 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b border-slate-700 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{row.id}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{row.timestamp}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={row.ocr?.mrz ? "PASS" : "FAIL"}>{row.ocr?.mrz ? "Extracted" : "No MRZ"}</Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={row.tamper?.verdict === "SUSPICIOUS" ? "FAIL" : "PASS"}>
                        {row.tamper?.verdict}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={row.face?.match ? "PASS" : "FAIL"}>
                        {row.face?.match ? "Match" : "No Match"}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={VERDICT_TONE[row.risk.risk_level]}>{row.risk.risk_level}</Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <button
                        onClick={() => setSelected(row)}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
