import { moderationStatusLabel } from "../utils";
import AdminStatsBar from "./AdminStatsBar";

export default function ModerationPanel({
  stats,
  queue,
  moderationFilter,
  setModerationFilter,
  moderationComments,
  setModerationComments,
  onApplyModeration
}) {
  return (
    <>
      <AdminStatsBar stats={stats} />
      <section className="mb-4 rounded-lg bg-white p-4 shadow">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Панель модератора</h2>
          <select
            className="rounded border px-2 py-1 text-sm"
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
          <div key={item.id} className="mb-2 rounded border p-2">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-slate-500">{item.created_by_name} · {moderationStatusLabel(item.moderation_status)}</p>
            <p className="text-xs text-slate-500">{item.category_name}</p>
            <textarea
              className="mt-2 w-full rounded border px-2 py-1 text-xs"
              rows={2}
              placeholder="Комментарий для организатора"
              value={moderationComments[item.id] || ""}
              onChange={(event) => setModerationComments((prev) => ({ ...prev, [item.id]: event.target.value }))}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={() => onApplyModeration(item.id, "APPROVED")}>Одобрить</button>
              <button className="rounded bg-amber-500 px-2 py-1 text-xs text-white" onClick={() => onApplyModeration(item.id, "NEEDS_EDIT")}>Нужны правки</button>
              <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={() => onApplyModeration(item.id, "REJECTED")}>Отклонить</button>
            </div>
          </div>
        ))}
        {queue.length === 0 && <p className="text-sm text-slate-500">Очередь пуста.</p>}
      </section>
    </>
  );
}
