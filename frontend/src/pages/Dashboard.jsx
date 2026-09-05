import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import VerdictBarChart from "../components/dashboard/VerdictBarChart";
import Icon from "../components/ui/Icon";

const VERDICT_TONE = { LOW: "PASS", MEDIUM: "REVIEW", HIGH: "FAIL" };

export default function Dashboard({ history, onNavigate }) {
  const total = history.length;
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  history.forEach((h) => counts[h.risk.risk_level]++);

  const kpis = [
    { label: "Total Verifications", value: total, icon: "activity", tone: "text-slate-200", bg: "bg-slate-700" },
    { label: "Passed", value: counts.LOW, icon: "checkCircle", tone: "text-green-400", bg: "bg-green-900" },
    { label: "Review", value: counts.MEDIUM, icon: "alertTriangle", tone: "text-amber-400", bg: "bg-amber-900" },
    { label: "Failed", value: counts.HIGH, icon: "x", tone: "text-red-400", bg: "bg-red-900" },
  ];

  const recent = history.slice(0, 5);
  const cardClasses =
    "bg-slate-800 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 hover:-translate-y-0.5 transition-all";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Screening activity for this session</p>
        </div>
        <button
          onClick={() => onNavigate("verify")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-900/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Icon name="shieldCheck" className="w-4 h-4" />
          Start Verification
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cardClasses}>
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">{kpi.label}</p>
              <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <Icon name={kpi.icon} className={`w-3.5 h-3.5 ${kpi.tone}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold mt-2 ${kpi.tone}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className={`${cardClasses} md:col-span-2`}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="layoutGrid" className="w-4 h-4 text-slate-400" />
            Verdict Distribution
          </h2>
          {total > 0 ? (
            <VerdictBarChart counts={counts} />
          ) : (
            <p className="text-sm text-slate-500">Run a verification to see the breakdown here.</p>
          )}
        </div>

        <div className={cardClasses}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="server" className="w-4 h-4 text-slate-400" />
            Pipeline Stages
          </h2>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: "OCR / MRZ", status: "Live", icon: "document", tone: "text-green-400" },
              { label: "Tampering", status: "Live", icon: "shieldCheck", tone: "text-green-400" },
              { label: "Liveness", status: "Not implemented", icon: "eye", tone: "text-slate-500" },
              { label: "Face Match", status: "Live", icon: "users", tone: "text-green-400" },
            ].map((s) => (
              <li key={s.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <Icon name={s.icon} className="w-3.5 h-3.5 text-slate-500" />
                  {s.label}
                </span>
                <span className={`text-xs ${s.tone}`}>{s.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cardClasses}>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="history" className="w-4 h-4 text-slate-400" />
          Recent Verifications
        </h2>
        {recent.length === 0 ? (
          <EmptyState
            title="No verifications yet"
            description="Screening results from this session will show up here."
            actionLabel="Start Verification"
            onAction={() => onNavigate("verify")}
            icon="activity"
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
                  <tr key={row.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/30 transition-colors">
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
