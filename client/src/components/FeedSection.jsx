import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import EventPointPicker from "./EventPointPicker";

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
  attendingIds,
  eventForm,
  setEventForm,
  onToggleFavorite,
  onToggleAttend,
  onOpenEvent,
  onDeleteEvent
}) {
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
            {meta.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={filters.districtId}
            onChange={(event) => setFilters((prev) => ({ ...prev, districtId: event.target.value }))}
          >
            <option value="">Все районы</option>
            {meta.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2"
            value={filters.dateFrom}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
          />
          <input
            type="date"
            className="rounded border border-slate-300 px-3 py-2"
            value={filters.dateTo}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-slate-600">
            Найдено: <strong>{total}</strong>
            {totalPages > 1 && <span className="text-slate-400"> · стр. {page} из {totalPages}</span>}
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
            <article key={event.id} className="rounded-lg bg-white p-4 shadow">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold">{event.title}</h2>
                <button type="button" onClick={() => onToggleFavorite(event.id)} className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">
                  {favorites.includes(event.id) ? "В избранном" : "В избранное"}
                </button>
              </div>
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="mb-2 max-h-32 w-full rounded object-cover" />
              )}
              <p className="mb-2 text-sm text-slate-600 line-clamp-2">{event.description}</p>
              <p className="text-xs text-slate-500">{event.category_name} · {event.district_name}</p>
              <p className="text-xs text-slate-500">{new Date(event.starts_at).toLocaleString("ru-RU")}</p>
              <p className="text-xs text-slate-500">Записались: {event.registrations_count || 0}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="rounded bg-indigo-100 px-2 py-1 text-xs" onClick={() => onOpenEvent(event.id)}>Подробнее</button>
                {token && (
                  <button className="rounded bg-emerald-100 px-2 py-1 text-xs" onClick={() => onToggleAttend(event.id, attendingIds.has(event.id))}>
                    {attendingIds.has(event.id) ? "Отменить запись" : "Записаться"}
                  </button>
                )}
                {(user?.role === "ADMIN" || myEventIds.has(event.id)) && (
                  <button className="rounded bg-rose-100 px-2 py-1 text-xs" onClick={() => onDeleteEvent(event.id)}>Удалить</button>
                )}
              </div>
            </article>
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
              <span className="text-sm text-slate-600">{page} / {totalPages}</span>
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
            {token && <EventPointPicker setEventForm={setEventForm} />}
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {eventForm.latitude && eventForm.longitude && (
              <Marker position={[Number(eventForm.latitude), Number(eventForm.longitude)]}>
                <Popup>Точка нового события</Popup>
              </Marker>
            )}
            {events
              .filter((event) => Number.isFinite(Number(event.latitude)) && Number.isFinite(Number(event.longitude)))
              .map((event) => (
                <Marker key={event.id} position={[Number(event.latitude), Number(event.longitude)]}>
                  <Popup>
                    <strong>{event.title}</strong>
                    <br />
                    {event.district_name}
                    <br />
                    <button type="button" className="mt-1 text-xs text-blue-600 underline" onClick={() => onOpenEvent(event.id)}>
                      Подробнее
                    </button>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </section>
    </>
  );
}
