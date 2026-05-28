import { moderationStatusLabel } from "../utils";

export default function AdminStatsBar({ stats }) {
  if (!stats) return null;

  const { totals, moderation } = stats;

  return (
    <section className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-3 lg:grid-cols-6">
      <div className="rounded bg-slate-50 p-3 text-center">
        <p className="text-2xl font-semibold">{totals.users_count}</p>
        <p className="text-xs text-slate-500">Пользователей</p>
      </div>
      <div className="rounded bg-slate-50 p-3 text-center">
        <p className="text-2xl font-semibold">{totals.events_count}</p>
        <p className="text-xs text-slate-500">Мероприятий</p>
      </div>
      <div className="rounded bg-slate-50 p-3 text-center">
        <p className="text-2xl font-semibold">{totals.registrations_count}</p>
        <p className="text-xs text-slate-500">Записей</p>
      </div>
      <div className="rounded bg-emerald-50 p-3 text-center">
        <p className="text-2xl font-semibold text-emerald-700">{moderation.APPROVED}</p>
        <p className="text-xs text-slate-500">{moderationStatusLabel("APPROVED")}</p>
      </div>
      <div className="rounded bg-amber-50 p-3 text-center">
        <p className="text-2xl font-semibold text-amber-700">{moderation.PENDING + moderation.NEEDS_EDIT}</p>
        <p className="text-xs text-slate-500">На модерации</p>
      </div>
      <div className="rounded bg-rose-50 p-3 text-center">
        <p className="text-2xl font-semibold text-rose-700">{moderation.REJECTED}</p>
        <p className="text-xs text-slate-500">{moderationStatusLabel("REJECTED")}</p>
      </div>
    </section>
  );
}
