import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import EventFeedCard from "./EventFeedCard";
import { canViewEventLocation } from "../utils";

export default function FeedSection({
  filters,
  setFilters,
  meta,
  events,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
  onResetFilters,
  favorites,
  token,
  user,
  myEventIds,
  registrationStatusMap,
  onToggleFavorite,
  onAttendAction,
  onOpenEvent,
  onDeleteEvent,
  onReportEvent,
  onOpenUser
}) {
  const mapEvents = events.filter((event) => {
    const canView = canViewEventLocation({
      event,
      registrationStatus: registrationStatusMap.get(event.id),
      isOrganizer: event.created_by === user?.id || myEventIds.has(event.id),
      isAdmin: user?.role === "ADMIN"
    });
    return (
      canView
      && Number.isFinite(Number(event.latitude))
      && Number.isFinite(Number(event.longitude))
    );
  });

  return (
    <>
      <section className="mb-6">
        <div className="filter-shell">
          <div className="filter-field min-w-[140px] flex-[1.4]">
            <span className="filter-label">Поиск</span>
            <input
              className="filter-input"
              placeholder="Название мероприятия"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            />
          </div>
          <div className="filter-field min-w-[120px]">
            <span className="filter-label">Категория</span>
            <select
              className="filter-select"
              value={filters.categoryId}
              onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <option value="">Все</option>
              {(meta?.categories || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field min-w-[120px]">
            <span className="filter-label">Источник</span>
            <select
              className="filter-select"
              value={filters.eventType}
              onChange={(event) => setFilters((prev) => ({ ...prev, eventType: event.target.value }))}
            >
              <option value="">Все</option>
              <option value="OFFICIAL">Официальные</option>
              <option value="COMMUNITY">От жителей</option>
            </select>
          </div>
          <div className="filter-field min-w-[110px]">
            <span className="filter-label">С даты</span>
            <input
              type="date"
              className="filter-input"
              aria-label="Дата с"
              value={filters.dateFrom}
              onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
            />
          </div>
          <div className="filter-field min-w-[110px]">
            <span className="filter-label">По дату</span>
            <input
              type="date"
              className="filter-input"
              aria-label="Дата по"
              value={filters.dateTo}
              onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium text-slate-900">
            Найдено: <span className="font-bold">{total}</span>
            {totalPages > 1 && (
              <span className="text-slate-400">
                {" "}
                · {page} / {totalPages}
              </span>
            )}
          </p>
          <button type="button" className="btn-secondary px-4 py-2 text-xs" onClick={onResetFilters}>
            Сбросить
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {loading && (
            <p className="card-surface p-6 text-center text-sm text-slate-500">Загрузка событий…</p>
          )}
          {!loading && events.length === 0 && (
            <p className="card-surface p-6 text-center text-sm text-slate-500">События не найдены.</p>
          )}
          {events.map((event) => (
            <EventFeedCard
              key={event.id}
              event={event}
              registrationStatus={registrationStatusMap.get(event.id)}
              isFavorite={favorites.includes(event.id)}
              canDelete={user?.role === "ADMIN" || myEventIds.has(event.id)}
              token={token}
              user={user}
              onToggleFavorite={onToggleFavorite}
              onAttendAction={onAttendAction}
              onOpenEvent={onOpenEvent}
              onDeleteEvent={onDeleteEvent}
              onReport={onReportEvent}
              onOpenUser={onOpenUser}
            />
          ))}
          {totalPages > 1 && (
            <div className="card-surface flex items-center justify-center gap-3 p-4">
              <button
                type="button"
                disabled={page <= 1}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                onClick={() => onPageChange(page - 1)}
              >
                ← Назад
              </button>
              <span className="text-sm font-semibold text-slate-900">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                onClick={() => onPageChange(page + 1)}
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>

        <div className="card-surface overflow-hidden lg:col-span-3">
          <MapContainer center={[54.9885, 73.3242]} zoom={12} style={{ height: "70vh", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapEvents.map((event) => (
              <Marker key={event.id} position={[Number(event.latitude), Number(event.longitude)]}>
                <Popup>
                  <strong className="text-slate-900">{event.title}</strong>
                  <br />
                  <span className="text-xs text-slate-600">{event.address}</span>
                  <br />
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-indigo-600 underline"
                    onClick={() => onOpenEvent(event.id)}
                  >
                    Открыть
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            На карте: {mapEvents.length} из {events.length}
          </p>
        </div>
      </section>
    </>
  );
}
