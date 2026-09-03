// P3 — Liveness detection is not implemented in the current backend
// (see verifyDocument.js: the /verify response only contains
// ocr / tamper / face). This card is a placeholder so the results layout
// already has a slot for liveness once that stage ships, rather than the
// page reflowing later.
export default function LivenessCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-dashed border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-slate-300">Liveness Check</h2>
        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-400">
          NOT AVAILABLE
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Liveness detection hasn't been added to the verification backend yet.
        This result won't factor into the risk score until it does.
      </p>
    </div>
  );
}
