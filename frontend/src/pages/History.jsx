import { useState } from "react";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResultsDashboard from "../components/verification/ResultsDashboard";
import Icon from "../components/ui/Icon";
import { generateBatchReportPdf } from "../utils/generateReportPdf";
import { useToast } from "../context/ToastContext";

const DAY_MS = 24 * 60 * 60 * 1000;

function toCsv(rows) {
  const header = [
    "Case ID",
    "Timestamp",
    "Subject Name",
    "Doc Type",
    "Document Number",
    "ICAO Checksums",
    "Tampering Verdict",
    "Tamper Score",
    "Biometric Liveness",
    "Liveness Score",
    "Face Match",
    "Similarity Score",
    "Risk Level",
    "Risk Score",
    "Officer Decision",
    "Officer Notes",
  ];
  const escape = (v) => `"${String(v ?? "-").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.id,
      r.timestamp,
      r.ocr?.mrz ? `${r.ocr.mrz.names || ""} ${r.ocr.mrz.surname || ""}`.trim() : "N/A",
      r.ocr?.detected_doc_type || (r.ocr?.mrz ? "Passport" : "Domestic ID"),
      r.ocr?.mrz?.number || "N/A",
      r.ocr?.mrz?.checksums_passed ? "Valid" : "Mismatch/None",
      r.tamper?.verdict,
      r.tamper?.tamper_score,
      r.liveness?.is_live ? "GENUINE_LIVE" : "SPOOF_ATTACK",
      r.liveness?.liveness_score,
      r.face?.match ? "Match" : "Mismatch",
      r.face?.similarity_score,
      r.risk?.risk_level,
      r.risk?.final_risk,
      r.officerDecision || "PENDING",
      r.officerNotes || "",
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
  a.download = `sentinelid-audit-ledger-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function History({ history, onNavigate, onUpdateDecision }) {
  const [openRecord, setOpenRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const { addToast } = useToast();

  if (openRecord) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setOpenRecord(null)}
          className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 focus:outline-none rounded px-1"
        >
          <Icon name="chevronRight" className="w-3.5 h-3.5 rotate-180" />
          Back to Verification Audit Ledger
        </button>
        <ResultsDashboard
          data={openRecord}
          onReset={() => setOpenRecord(null)}
          onUpdateDecision={(id, decisionData) => {
            if (onUpdateDecision) onUpdateDecision(id, decisionData);
            setOpenRecord((prev) => ({ ...prev, ...decisionData }));
          }}
        />
      </div>
    );
  }

  const now = Date.now();
  const filtered = history.filter((row) => {
    if (verdictFilter !== "ALL" && row.risk?.risk_level !== verdictFilter) return false;
    if (dateFilter === "TODAY") {
      const d = new Date(row.timestampMs ?? 0);
      if (d.toDateString() !== new Date().toDateString()) return false;
    }
    if (dateFilter === "7D" && now - (row.timestampMs ?? 0) > 7 * DAY_MS) return false;
    if (search) {
      const q = search.trim().toLowerCase();
      const idMatch = row.id?.toLowerCase().includes(q);
      const nameMatch = row.ocr?.mrz
        ? `${row.ocr.mrz.names || ""} ${row.ocr.mrz.surname || ""}`.toLowerCase().includes(q)
        : false;
      const numMatch = row.ocr?.mrz?.number?.toLowerCase().includes(q);
      if (!idMatch && !nameMatch && !numMatch) return false;
    }
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
      if (allFilteredSelected) {
        filtered.forEach((r) => next.delete(r.id));
      } else {
        filtered.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const handleBatchPdf = async () => {
    const selectedCases = history.filter((h) => selectedIds.has(h.id));
    if (selectedCases.length === 0) return;
    setGeneratingBatch(true);
    try {
      await generateBatchReportPdf(selectedCases);
      addToast(`Generated batch report for ${selectedCases.length} cases.`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to compile batch report.", "error");
    } finally {
      setGeneratingBatch(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Verification Audit Ledger</h1>
          <p className="text-slate-400 text-xs mt-1">
            Historical checkpoint screenings, forensic alerts, and officer decisions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-40"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-amber-400" />
            Export CSV
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchPdf}
              disabled={generatingBatch}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
            >
              <Icon name="fileText" className="w-3.5 h-3.5 text-slate-950" />
              {generatingBatch ? "Compiling…" : `Batch PDF (${selectedIds.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/90 border border-slate-700/60 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative w-full max-w-sm">
            <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Case ID, Citizen Name, or Passport No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Verdict Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
            {["ALL", "LOW", "MEDIUM", "HIGH"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setVerdictFilter(lvl)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  verdictFilter === lvl
                    ? "bg-slate-700 text-amber-400 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {lvl === "LOW" ? "PASS" : lvl === "MEDIUM" ? "REVIEW" : lvl === "HIGH" ? "FAIL" : "ALL"}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
            {[
              { id: "ALL", label: "All Time" },
              { id: "TODAY", label: "Today" },
              { id: "7D", label: "7 Days" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  dateFilter === d.id
                    ? "bg-slate-700 text-slate-100 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title="No Screening Cases Found"
              description="No verifications match the selected search criteria or date filter."
              actionLabel="Initiate Screening"
              onAction={() => onNavigate("verify")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4 w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold">Case ID</th>
                  <th className="py-3 px-3 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">Subject / Document</th>
                  <th className="py-3 px-3 font-semibold">Tamper</th>
                  <th className="py-3 px-3 font-semibold">Liveness</th>
                  <th className="py-3 px-3 font-semibold">Facial Match</th>
                  <th className="py-3 px-3 font-semibold">Decision</th>
                  <th className="py-3 px-3 font-semibold">Risk Level</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const name = row.ocr?.mrz
                    ? `${row.ocr.mrz.names || ""} ${row.ocr.mrz.surname || ""}`.trim()
                    : "Domestic ID / Non-MRZ";
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-700/40 transition-colors cursor-pointer ${
                        isSelected ? "bg-slate-700/20" : ""
                      }`}
                      onClick={() => setOpenRecord(row)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(row.id)}
                          className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-200">{row.id}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">{row.timestamp}</td>
                      <td className="py-3 px-3 text-slate-200 font-medium">{name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            row.tamper?.verdict === "SUSPICIOUS"
                              ? "bg-red-950/60 text-red-400 border border-red-500/30"
                              : "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {row.tamper?.verdict || "CLEAN"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            row.face?.match
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-950/60 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {row.face?.match ? "MATCH" : "MISMATCH"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] text-slate-400">
                          {row.officerDecision ? (
                            <span className="text-amber-400 font-semibold">{row.officerDecision}</span>
                          ) : (
                            "—"
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge level={row.risk?.risk_level} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRecord(row);
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
