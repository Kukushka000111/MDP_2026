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
      <section className="mb-4 rounded-lg bg-white p-4 shadow">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Поиск по названию"
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
          />
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={filters.categoryId}
            onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">Все категории</option>
            {meta.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={filters.eventType}
            onChange={(event) => setFilters((prev) => ({ ...prev, eventType: event.target.value }))}
          >
            <option value="">Все источники</option>
            <option value="OFFICIAL">Официальные</option>
            <option value="COMMUNITY">От жителей</option>
          </select>
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2"
            aria-label="Дата с"
            value={filters.dateFrom}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
          />
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2"
            aria-label="Дата по"
            value={filters.dateTo}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-slate-600">
            Найдено: <strong>{total}</strong>
            {totalPages > 1 && (
              <span className="text-slate-400">
                {" "}
                · стр. {page} из {totalPages}
              </span>
            )}
          </p>
          <button type="button" className="rounded bg-slate-100 px-3 py-1 text-sm" onClick={onResetFilters}>
            Сбросить фильтры
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {loading && <p className="rounded bg-white p-3 shadow">Загрузка событий...</p>}
          {!loading && events.length === 0 && <p className="rounded bg-white p-3 shadow">События не найдены.</p>}
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
            <div className="flex items-center justify-center gap-2 rounded bg-white p-3 shadow">
              <button
                type="button"
                disabled={page <= 1}
                className="rounded bg-slate-100 px-3 py-1 text-sm disabled:opacity-40"
                onClick={() => onPageChange(page - 1)}
              >
                ← Назад
              </button>
              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                className="rounded bg-slate-100 px-3 py-1 text-sm disabled:opacity-40"
                onClick={() => onPageChange(page + 1)}
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow lg:col-span-3">
          <MapContainer center={[54.9885, 73.3242]} zoom={12} style={{ height: "70vh", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapEvents.map((event) => (
              <Marker key={event.id} position={[Number(event.latitude), Number(event.longitude)]}>
                <Popup>
                  <strong>{event.title}</strong>
                  <br />
                  <span className="text-xs text-slate-600">{event.address}</span>
                  <br />
                  <button
                    type="button"
                    className="mt-1 text-xs text-blue-600 underline"
                    onClick={() => onOpenEvent(event.id)}
                  >
                    Открыть
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <p className="border-t px-3 py-2 text-xs text-slate-500">
            На карте: {mapEvents.length} из {events.length} (публичные адреса и ваши одобренные заявки)
          </p>
        </div>
      </section>
    </>
  );
}
