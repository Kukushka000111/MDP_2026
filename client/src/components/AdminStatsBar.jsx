import { moderationStatusLabel } from "../utils";

export default function AdminStatsBar({ stats }) {
  if (!stats) return null;

  const { totals, moderation } = stats;

  return (
    <section className="admin-panel mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <div className="stat-tile">
        <p className="stat-tile-value">{totals.users_count}</p>
        <p className="stat-tile-label">Пользователей</p>
      </div>
      <div className="stat-tile">
        <p className="stat-tile-value">{totals.events_count}</p>
        <p className="stat-tile-label">Мероприятий</p>
      </div>
      <div className="stat-tile">
        <p className="stat-tile-value">{totals.registrations_count}</p>
        <p className="stat-tile-label">Записей</p>
      </div>
      <div className="stat-tile-emerald">
        <p className="stat-tile-value">{moderation.APPROVED}</p>
        <p className="stat-tile-label">{moderationStatusLabel("APPROVED")}</p>
      </div>
      <div className="stat-tile-amber">
        <p className="stat-tile-value">{moderation.PENDING + moderation.NEEDS_EDIT}</p>
        <p className="stat-tile-label">На модерации</p>
      </div>
      <div className="stat-tile-rose">
        <p className="stat-tile-value">{moderation.REJECTED}</p>
        <p className="stat-tile-label">{moderationStatusLabel("REJECTED")}</p>
      </div>
      <div className="stat-tile-violet">
        <p className="stat-tile-value">{totals.reports_count ?? 0}</p>
        <p className="stat-tile-label">Жалоб</p>
      </div>
    </section>
  );
}
