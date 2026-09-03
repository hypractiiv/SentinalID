const STYLES = {
  PASS: "bg-green-900 text-green-300",
  LOW: "bg-green-900 text-green-300",
  REVIEW: "bg-amber-900 text-amber-300",
  MEDIUM: "bg-amber-900 text-amber-300",
  FAIL: "bg-red-900 text-red-300",
  HIGH: "bg-red-900 text-red-300",
  PROCESSING: "bg-slate-700 text-slate-300",
  NEUTRAL: "bg-slate-700 text-slate-400",
};

export default function Badge({ children, tone = "NEUTRAL" }) {
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STYLES[tone] ?? STYLES.NEUTRAL}`}>
      {children}
    </span>
  );
}
