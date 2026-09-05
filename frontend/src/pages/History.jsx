import { useState } from "react";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResultsDashboard from "../components/verification/ResultsDashboard";
import Icon from "../components/ui/Icon";
import { generateBatchReportPdf } from "../utils/generateReportPdf";
import { useToast } from "../context/ToastContext";

const VERDICT_TONE = { LOW: "PASS", MEDIUM: "REVIEW", HIGH: "FAIL" };
const DAY_MS = 24 * 60 * 60 * 1000;

function toCsv(rows) {
  const header = [
    "Verification ID",
    "Timestamp",
    "OCR",
    "Tampering Verdict",
    "Tamper Score",
    "Face Match",
    "Similarity",
    "Risk Level",
    "Risk Score",
  ];
  const escape = (v) => `"${String(v ?? "-").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.id,
      r.timestamp,
      r.ocr?.mrz ? "Extracted" : "No MRZ",
      r.tamper?.verdict,
      r.tamper?.tamper_score,
      r.face?.match ? "Match" : "No Match",
      r.face?.similarity_score,
      r.risk.risk_level,
      r.risk.final_risk,
    ]
      .map(escape)
      .join(",")
  );
  return [header.map(escape).join(","), ...lines].join("\n");
}

function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sentinelid-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function History({ history, onNavigate }) {
  const [openRecord, setOpenRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const { addToast } = useToast();

  if (openRecord) {
    return (
      <div>
        <button
          onClick={() => setOpenRecord(null)}
          className="text-sm text-slate-400 hover:text-amber-400 transition-colors mb-6 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
        >
          <Icon name="chevronRight" className="w-3.5 h-3.5 rotate-180" />
          Back to history
        </button>
        <ResultsDashboard data={openRecord} onReset={() => setOpenRecord(null)} />
      </div>
    );
  }

  const now = Date.now();
  const filtered = history.filter((row) => {
    if (verdictFilter !== "ALL" && row.risk.risk_level !== verdictFilter) return false;
    if (dateFilter === "TODAY") {
      const d = new Date(row.timestampMs ?? 0);
      if (d.toDateString() !== new Date().toDateString()) return false;
    }
    if (dateFilter === "7D" && now - (row.timestampMs ?? 0) > 7 * DAY_MS) return false;
    if (search && !row.id.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((r) => (allFilteredSelected ? next.delete(r.id) : next.add(r.id)));
      return next;
    });
  };

  const handleBatchDownload = async () => {
    const cases = history
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({ verificationId: r.id, timestamp: r.timestamp, data: r }));
    if (!cases.length) return;
    setGeneratingBatch(true);
    try {
      await generateBatchReportPdf(cases);
    } catch (err) {
      console.error(err);
      addToast("Couldn't generate the combined report.", "error");
    } finally {
      setGeneratingBatch(false);
    }
  };

  const inputClasses =
    "bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400";

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Verification History</h1>
      <p className="text-slate-400 text-sm mb-6">Cases screened during this session</p>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        {history.length === 0 ? (
          <EmptyState
            title="No history yet"
            description="Completed verifications from this session will appear here for review."
            actionLabel="Start Verification"
            onAction={() => onNavigate("verify")}
            icon="history"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative">
                <Icon name="search" className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by verification ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputClasses} w-56 pl-8`}
                />
              </div>
              <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value)} className={inputClasses}>
                <option value="ALL">All verdicts</option>
                <option value="LOW">Passed (Low)</option>
                <option value="MEDIUM">Review (Medium)</option>
                <option value="HIGH">Failed (High)</option>
              </select>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={inputClasses}>
                <option value="ALL">All time</option>
                <option value="TODAY">Today</option>
                <option value="7D">Last 7 days</option>
              </select>

              <div className="flex-1" />

              {selectedIds.size > 0 && (
                <button
                  onClick={handleBatchDownload}
                  disabled={generatingBatch}
                  className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Icon name="download" className="w-3.5 h-3.5" />
                  {generatingBatch ? "Generating…" : `Download ${selectedIds.size} as PDF`}
                </button>
              )}
              <button
                onClick={() => downloadCsv(filtered)}
                disabled={filtered.length === 0}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Icon name="download" className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="No matching cases"
                description="Try adjusting your search or filters."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-700">
                      <th className="py-2 pr-4 font-medium w-8">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          className="accent-amber-500"
                          aria-label="Select all filtered cases"
                        />
                      </th>
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
                    {filtered.map((row) => (
                      <tr key={row.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 pr-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelected(row.id)}
                            className="accent-amber-500"
                            aria-label={`Select ${row.id}`}
                          />
                        </td>
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
                            onClick={() => setOpenRecord(row)}
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                          >
                            View Report
                            <Icon name="chevronRight" className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
