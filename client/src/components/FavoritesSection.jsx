import EventFeedCard from "./EventFeedCard";

export default function FavoritesSection({
  events,
  favorites,
  registrationStatusMap,
  token,
  user,
  myEventIds,
  onOpen,
  onToggleFavorite,
  onAttendAction,
  onDeleteEvent,
  onReport,
  onOpenUser
}) {
  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="section-heading text-2xl sm:text-3xl">Избранное</h2>
        <p className="mt-1 text-sm text-slate-500">Сохранённые мероприятия — как в ленте</p>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((item) => (
            <EventFeedCard
              key={item.id}
              event={item}
              registrationStatus={registrationStatusMap.get(item.id)}
              isFavorite={favorites.includes(item.id)}
              canDelete={user?.role === "ADMIN" || myEventIds.has(item.id)}
              token={token}
              user={user}
              onToggleFavorite={onToggleFavorite}
              onAttendAction={onAttendAction}
              onOpenEvent={onOpen}
              onDeleteEvent={onDeleteEvent}
              onReport={onReport}
              onOpenUser={onOpenUser}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Избранное пусто. Нажмите ★ на карточке в ленте.
        </p>
      )}
    </section>
  );
}
