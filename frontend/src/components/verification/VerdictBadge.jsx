import Icon from "../ui/Icon";

const STYLES = {
  HIGH: { classes: "bg-red-900 text-red-300", icon: "x" },
  MEDIUM: { classes: "bg-amber-900 text-amber-300", icon: "alertTriangle" },
  LOW: { classes: "bg-green-900 text-green-300", icon: "checkCircle" },
};

export default function VerdictBadge({ level }) {
  const style = STYLES[level] ?? STYLES.MEDIUM;
  return (
    <span
      className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-sm font-semibold ${style.classes}`}
    >
      <Icon name={style.icon} className="w-3.5 h-3.5" />
      {level} RISK
    </span>
  );
}
