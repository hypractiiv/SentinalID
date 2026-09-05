// Deliberately a plain CSS/div bar chart rather than pulling in a
// charting library — this session's history is small and the shape is
// simple (three categories), so a lightweight custom component keeps the
// bundle size down.
export default function VerdictBarChart({ counts }) {
  const rows = [
    { label: "Passed", value: counts.LOW ?? 0, color: "#22c55e" },
    { label: "Review", value: counts.MEDIUM ?? 0, color: "#f59e0b" },
    { label: "Failed", value: counts.HIGH ?? 0, color: "#ef4444" },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-14 text-xs text-slate-400 shrink-0">{row.label}</span>
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }}
            />
          </div>
          <span className="w-6 text-xs text-slate-400 text-right shrink-0">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
