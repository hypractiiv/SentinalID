import Icon from "./Icon";

export default function EmptyState({ title, description, actionLabel, onAction, icon = "search" }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-700/60 flex items-center justify-center mb-1">
        <Icon name={icon} className="w-5 h-5 text-slate-500" />
      </div>
      <p className="font-semibold text-slate-200">{title}</p>
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-2 px-5 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
