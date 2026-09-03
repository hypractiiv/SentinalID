export default function VerdictBadge({ level }) {
  const styles = {
    HIGH: "bg-red-900 text-red-300",
    MEDIUM: "bg-amber-900 text-amber-300",
    LOW: "bg-green-900 text-green-300",
  };
  return (
    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${styles[level]}`}>
      {level} RISK
    </span>
  );
}
