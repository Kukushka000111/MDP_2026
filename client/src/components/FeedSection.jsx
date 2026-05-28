import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from "../constants";
import EventFeedCard from "./EventFeedCard";
import { canViewEventLocation } from "../utils";

function countActiveFilters(filters) {
  return [filters.categoryId, filters.eventType, filters.dateFrom, filters.dateTo].filter(Boolean).length;
}

function FilterFields({ filters, setFilters, meta, className = "" }) {
  return (
    <>
      <div className={`filter-field min-w-0 flex-[1.2] ${className}`}>
        <span className="filter-label">Поиск</span>
        <input
          className="filter-input"
          placeholder="Название мероприятия"
          value={filters.q}
          onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
        />
      </div>
      <div className={`filter-field min-w-[100px] ${className}`}>
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
      <div className={`filter-field min-w-[96px] ${className}`}>
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
      <div className={`filter-field min-w-[96px] ${className}`}>
        <span className="filter-label">С даты</span>
        <input
          type="date"
          className="filter-input"
          aria-label="Дата с"
          value={filters.dateFrom}
          onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
        />
      </div>
      <div className={`filter-field min-w-[96px] ${className}`}>
        <span className="filter-label">По дату</span>
        <input
          type="date"
          className="filter-input"
          aria-label="Дата по"
          value={filters.dateTo}
          onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
        />
      </div>
    </>
  );
}

function FeedMap({ mapEvents, events, onOpenEvent, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm ${className}`}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        className="z-0 h-full w-full min-h-[12rem]"
        style={{ height: "100%", width: "100%" }}
      >
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
      <p className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-transparent px-3 pb-2 pt-4 text-xs text-slate-600">
        На карте: {mapEvents.length} из {events.length}
      </p>
    </div>
  );
}

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

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

  const resultsLine = (
    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
      Найдено: <span className="font-bold">{total}</span>
      {totalPages > 1 && (
        <span className="text-slate-400">
          {" "}
          · {page} / {totalPages}
        </span>
      )}
    </p>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 sm:px-4 md:px-5">
      <section className="shrink-0 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/60 py-2 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80 lg:py-4">
        {/* Мобильная панель: поиск + кнопка фильтров */}
        <div className="mx-auto w-full max-w-5xl lg:hidden">
          <div className="flex items-center gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-900/50">
              <span className="sr-only">Поиск</span>
              <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Поиск событий…"
                value={filters.q}
                onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              />
            </label>
            <button
              type="button"
              className={`relative shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                filtersOpen || activeFilterCount > 0
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              }`}
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              Фильтры
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-2">
                <div className="filter-field-mobile col-span-2 sm:col-span-1">
                  <span className="filter-label">Категория</span>
                  <select
                    className="filter-select-mobile"
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
                <div className="filter-field-mobile col-span-2 sm:col-span-1">
                  <span className="filter-label">Источник</span>
                  <select
                    className="filter-select-mobile"
                    value={filters.eventType}
                    onChange={(event) => setFilters((prev) => ({ ...prev, eventType: event.target.value }))}
                  >
                    <option value="">Все</option>
                    <option value="OFFICIAL">Официальные</option>
                    <option value="COMMUNITY">От жителей</option>
                  </select>
                </div>
                <div className="filter-field-mobile">
                  <span className="filter-label">С даты</span>
                  <input
                    type="date"
                    className="filter-select-mobile"
                    value={filters.dateFrom}
                    onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
                  />
                </div>
                <div className="filter-field-mobile">
                  <span className="filter-label">По дату</span>
                  <input
                    type="date"
                    className="filter-select-mobile"
                    value={filters.dateTo}
                    onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                {resultsLine}
                <button type="button" className="btn-secondary shrink-0 px-3 py-1.5 text-xs" onClick={onResetFilters}>
                  Сбросить
                </button>
              </div>
            </div>
          )}

          {!filtersOpen && <div className="mt-1.5">{resultsLine}</div>}

          <div className="mt-2 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${
                mobileView === "list" ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"
              }`}
              onClick={() => setMobileView("list")}
            >
              Список
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${
                mobileView === "map" ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"
              }`}
              onClick={() => setMobileView("map")}
            >
              Карта
            </button>
          </div>
        </div>

        {/* Десктоп: полная панель фильтров */}
        <div className="mx-auto hidden w-full max-w-5xl lg:block">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-indigo-600">
            Найдите событие в Костроме
          </p>
          <div className="filter-shell filter-shell-feed">
            <FilterFields filters={filters} setFilters={setFilters} meta={meta} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {resultsLine}
            <button type="button" className="btn-secondary px-4 py-2 text-xs" onClick={onResetFilters}>
              Сбросить
            </button>
          </div>
        </div>
      </section>

      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden border-t border-slate-100 pt-2 dark:border-slate-800 lg:pt-3">
        {/* Мобильная карта */}
        {mobileView === "map" && (
          <div className="h-full min-h-0 w-full lg:hidden">
            <FeedMap
              mapEvents={mapEvents}
              events={events}
              onOpenEvent={onOpenEvent}
              className="h-full"
            />
          </div>
        )}

        {/* Список событий */}
        <div
          className={`custom-scrollbar h-full w-full overflow-y-auto py-1 pr-1 lg:block lg:w-[60%] ${
            mobileView === "map" ? "hidden" : ""
          }`}
        >
          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">Загрузка событий…</p>
          )}
          {!loading && events.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">События не найдены.</p>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {events.map((event) => (
              <EventFeedCard
                key={event.id}
                compact
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
          </div>

          {totalPages > 1 && (
            <div className="card-surface mt-4 flex items-center justify-center gap-3 p-3">
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

        {/* Десктопная карта */}
        <aside className="relative hidden min-h-0 shrink-0 self-stretch lg:block lg:w-[40%]">
          <FeedMap
            mapEvents={mapEvents}
            events={events}
            onOpenEvent={onOpenEvent}
            className="h-full min-h-[20rem]"
          />
        </aside>
      </div>
    </div>
  );
}
