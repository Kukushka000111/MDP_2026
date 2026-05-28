export default function EventListRow({ title, subtitle, badge, onOpen, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="mb-2 cursor-pointer rounded-lg border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children && (
        <div className="mt-2" onClick={(event) => event.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}
