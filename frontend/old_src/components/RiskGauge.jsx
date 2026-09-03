export default function RiskGauge({ score }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 60 ? "#ef4444" : score > 30 ? "#f59e0b" : "#22c55e";

  return (
    <svg width="110" height="110" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" stroke="#334155" strokeWidth="8" fill="none" />
      <circle
        cx="50" cy="50" r="45" stroke={color} strokeWidth="8" fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
      />
      <text x="50" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{score}</text>
    </svg>
  );
}