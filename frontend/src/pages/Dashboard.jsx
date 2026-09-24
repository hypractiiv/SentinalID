import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import VerdictBarChart from "../components/dashboard/VerdictBarChart";
import Icon from "../components/ui/Icon";

export default function Dashboard({ history, onNavigate }) {
  const total = history.length;
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  let totalLatency = 0;
  let latencyCount = 0;
  let tamperedCount = 0;
  let faceMismatchCount = 0;
  let spoofAttackCount = 0;

  history.forEach((h) => {
    const lvl = h.risk?.risk_level || "MEDIUM";
    if (counts[lvl] !== undefined) counts[lvl]++;

    const lat = h.telemetry?.processing_time_ms || h.telemetry?.client_roundtrip_ms;
    if (lat) {
      totalLatency += lat;
      latencyCount++;
    }

    if (h.tamper?.verdict === "SUSPICIOUS") tamperedCount++;
    if (h.face && !h.face.match) faceMismatchCount++;
    if (h.liveness && !h.liveness.is_live) spoofAttackCount++;
  });

  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

  const kpis = [
    {
      label: "Total Screenings",
      value: total,
      sub: "Active Session Ledger",
      icon: "activity",
      tone: "text-slate-100",
      bg: "bg-slate-700/60 border-slate-600",
    },
    {
      label: "Cleared (Pass)",
      value: counts.LOW,
      sub: "Immediate Clearance",
      icon: "checkCircle",
      tone: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-500/40",
    },
    {
      label: "Secondary Review",
      value: counts.MEDIUM,
      sub: "Manual Verification",
      icon: "alertTriangle",
      tone: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-500/40",
    },
    {
      label: "High Risk / Denied",
      value: counts.HIGH,
      sub: "Spoof / Tamper Alert",
      icon: "x",
      tone: "text-red-400",
      bg: "bg-red-950/40 border-red-500/40",
    },
  ];

  const recent = history.slice(0, 5);
  const cardClasses =
    "bg-slate-800/90 rounded-2xl p-6 border border-slate-700/60 shadow-sm hover:border-slate-600 transition-all";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Checkpoint Operations Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time biometric intelligence and document screening telemetry
          </p>
        </div>
        <button
          onClick={() => onNavigate("verify")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Icon name="shieldCheck" className="w-4 h-4 text-slate-950" strokeWidth={2.2} />
          New Identity Screening
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`${cardClasses} p-5`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} border flex items-center justify-center`}>
                <Icon name={kpi.icon} className={`w-4 h-4 ${kpi.tone}`} strokeWidth={2} />
              </div>
            </div>
            <p className={`text-3xl font-black mt-2 tracking-tight ${kpi.tone}`}>{kpi.value}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Analytics & Pipeline Health */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className={`${cardClasses} md:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-200">
              <Icon name="layoutGrid" className="w-4 h-4 text-amber-400" />
              Threat Distribution & Screening Volume
            </h2>
            {avgLatency > 0 && (
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
                Avg Latency: {avgLatency}ms
              </span>
            )}
          </div>
          {total > 0 ? (
            <VerdictBarChart counts={counts} />
          ) : (
            <p className="text-xs text-slate-500 italic py-8 text-center">
              No screenings conducted in this session yet. Start a verification to view real-time statistics.
            </p>
          )}

          {/* Threat Breakdown Tags */}
          {total > 0 && (
            <div className="grid grid-cols-3 gap-2.5 pt-4 mt-4 border-t border-slate-700/60 text-center">
              <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/40">
                <span className="text-[10px] text-slate-400 block">Tampered Docs Flagged</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{tamperedCount}</span>
              </div>
              <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/40">
                <span className="text-[10px] text-slate-400 block">Biometric Mismatches</span>
                <span className="font-mono font-bold text-rose-400 text-sm">{faceMismatchCount}</span>
              </div>
              <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/40">
                <span className="text-[10px] text-slate-400 block">Spoof / Replays Blocked</span>
                <span className="font-mono font-bold text-red-400 text-sm">{spoofAttackCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pipeline Active Health Monitor */}
        <div className={cardClasses}>
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-200">
            <Icon name="server" className="w-4 h-4 text-emerald-400" />
            Active CV Pipeline Modules
          </h2>
          <ul className="space-y-3 text-xs">
            {[
              {
                label: "ICAO 9303 OCR / MRZ",
                status: "Operational",
                desc: "Check digit validation & layout parsing",
                icon: "document",
                tone: "text-emerald-400",
              },
              {
                label: "Tamper ELA & Splicing",
                status: "Operational",
                desc: "In-memory compression artifact diffing",
                icon: "shieldCheck",
                tone: "text-emerald-400",
              },
              {
                label: "Biometric Liveness (PAD)",
                status: "Operational",
                desc: "2D FFT moiré, texture & 3D reflectance",
                icon: "eye",
                tone: "text-emerald-400",
              },
              {
                label: "ArcFace Biometric Match",
                status: "Operational",
                desc: "512-dim facial feature cosine distance",
                icon: "users",
                tone: "text-emerald-400",
              },
            ].map((s) => (
              <li key={s.label} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/50 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Icon name={s.icon} className="w-3.5 h-3.5 text-amber-400" />
                    {s.label}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 ${s.tone}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">{s.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Verifications Feed */}
      <div className={cardClasses}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-slate-200">
            <Icon name="history" className="w-4 h-4 text-cyan-400" />
            Recent Screening Ledger
          </h2>
          {recent.length > 0 && (
            <button
              onClick={() => onNavigate("history")}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              View Full History &rarr;
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No Screenings Conducted Yet"
            description="Screening cases initiated at this terminal will appear in this real-time audit ledger."
            actionLabel="Start Screening"
            onAction={() => onNavigate("verify")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                <tr>
                  <th className="pb-2.5 font-medium">Case ID</th>
                  <th className="pb-2.5 font-medium">Timestamp</th>
                  <th className="pb-2.5 font-medium">Document / MRZ</th>
                  <th className="pb-2.5 font-medium">Liveness</th>
                  <th className="pb-2.5 font-medium">Biometric Match</th>
                  <th className="pb-2.5 font-medium">Verdict</th>
                  <th className="pb-2.5 font-medium text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {recent.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 font-mono font-semibold text-slate-200">{row.id}</td>
                    <td className="py-3 text-slate-400">{row.timestamp}</td>
                    <td className="py-3 text-slate-300">
                      {row.ocr?.mrz ? `${row.ocr.mrz.names || ""} ${row.ocr.mrz.surname || ""}` : "Domestic ID / Non-MRZ"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          row.liveness?.is_live
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-950/60 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {row.liveness?.is_live ? "LIVE" : "SPOOF"}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          row.face?.match
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-950/60 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {row.face?.match ? `MATCH (${row.face.similarity_score}%)` : "MISMATCH"}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge level={row.risk?.risk_level} />
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-200">
                      {row.risk?.final_risk ?? 0}/100
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
