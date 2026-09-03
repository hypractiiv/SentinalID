import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const VERDICT_TONE = { LOW: "PASS", MEDIUM: "REVIEW", HIGH: "FAIL" };

export default function Dashboard({ history, onNavigate }) {
  const total = history.length;
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  history.forEach((h) => counts[h.risk.risk_level]++);

  const kpis = [
    { label: "Total Verifications", value: total },
    { label: "Passed", value: counts.LOW, tone: "text-green-400" },
    { label: "Review", value: counts.MEDIUM, tone: "text-amber-400" },
    { label: "Failed", value: counts.HIGH, tone: "text-red-400" },
  ];

  const recent = history.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Screening activity for this session</p>
        </div>
        <button
          onClick={() => onNavigate("verify")}
          className="px-5 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors"
        >
          Start Verification
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-2 ${kpi.tone ?? ""}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Verifications</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="No verifications yet"
            description="Screening results from this session will show up here."
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
                  <th className="py-2 pr-4 font-medium">Overall Verdict</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} className="border-b border-slate-700 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{row.id}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{row.timestamp}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={VERDICT_TONE[row.risk.risk_level]}>{row.risk.risk_level}</Badge>
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
