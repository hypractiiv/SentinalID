export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-3">
      <p className="font-semibold text-slate-200">{title}</p>
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-2 px-5 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
