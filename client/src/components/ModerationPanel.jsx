import { moderationStatusLabel } from "../utils";
import AdminStatsBar from "./AdminStatsBar";

function formatReportDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ModerationPanel({
  stats,
  queue,
  reports = [],
  moderationFilter,
  setModerationFilter,
  moderationComments,
  setModerationComments,
  onApplyModeration,
  onOpenEvent
}) {
  return (
    <>
      <AdminStatsBar stats={stats} />

      <section className="admin-panel border-violet-100 dark:border-violet-900/50">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Жалобы на мероприятия</h2>
            <p className="text-sm text-muted">Сообщения пользователей об опубликованных событиях</p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            {reports.length}
          </span>
        </div>
        {reports.map((item) => (
          <div key={item.id} className="surface-inset mb-2 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <button
                  type="button"
                  className="text-left font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => onOpenEvent?.(item.event_id)}
                >
                  {item.event_title}
                </button>
                <p className="mt-1 text-xs text-muted">
                  {item.reporter_name || item.reporter_login}
                  {item.reporter_email ? ` · ${item.reporter_email}` : ""}
                  {" · "}
                  {formatReportDate(item.created_at)}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={() => onOpenEvent?.(item.event_id)}
              >
                Открыть событие
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {item.reason?.trim() || "Без комментария"}
            </p>
          </div>
        ))}
        {reports.length === 0 && <p className="text-sm text-muted">Жалоб пока нет.</p>}
      </section>

      <section className="admin-panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Очередь модерации</h2>
          <select
            className="input-field w-auto py-1.5 text-sm"
            value={moderationFilter}
            onChange={(event) => setModerationFilter(event.target.value)}
          >
            <option value="">Очередь (ожидают + правки)</option>
            <option value="PENDING">Только на модерации</option>
            <option value="NEEDS_EDIT">Только нужны правки</option>
            <option value="APPROVED">Одобренные</option>
            <option value="REJECTED">Отклонённые</option>
          </select>
        </div>
        {queue.map((item) => (
          <div key={item.id} className="surface-inset mb-2 p-3">
            <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="text-xs text-muted">
              {item.created_by_name} · {moderationStatusLabel(item.moderation_status)}
            </p>
            <p className="text-xs text-muted">{item.category_name}</p>
            <textarea
              className="input-field mt-2 text-xs"
              rows={2}
              placeholder="Комментарий для организатора"
              value={moderationComments[item.id] || ""}
              onChange={(event) => setModerationComments((prev) => ({ ...prev, [item.id]: event.target.value }))}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                onClick={() => onApplyModeration(item.id, "APPROVED")}
              >
                Одобрить
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-400"
                onClick={() => onApplyModeration(item.id, "NEEDS_EDIT")}
              >
                Нужны правки
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500"
                onClick={() => onApplyModeration(item.id, "REJECTED")}
              >
                Отклонить
              </button>
            </div>
          </div>
        ))}
        {queue.length === 0 && <p className="text-sm text-muted">Очередь пуста.</p>}
      </section>
    </>
  );
}
