import OrganizerContacts from "./OrganizerContacts";
import UserLink from "./UserLink";
import {
  attendButtonLabel,
  canViewOrganizerContacts,
  buildContactLinks,
  eventSpotsInfo,
  isEventOrganizer,
  organizerEventsLabel,
  platformTenureLabel,
  spotsBadgeText
} from "../utils";

export default function EventFeedCard({
  event,
  registrationStatus,
  isFavorite,
  canDelete,
  token,
  user,
  onToggleFavorite,
  onAttendAction,
  onOpenEvent,
  onDeleteEvent,
  onReport,
  onOpenUser
}) {
  const spots = eventSpotsInfo(event);
  const badge = spotsBadgeText(event);
  const contacts = buildContactLinks(event);
  const verified = event.organizer_verified === true || event.organizer_verified === "t";
  const hasRegistration = registrationStatus === "APPROVED" || registrationStatus === "PENDING";
  const isOrganizer = isEventOrganizer(event, user?.id);
  const isAdmin = user?.role === "ADMIN";
  const showContacts = canViewOrganizerContacts({
    registrationStatus,
    isOrganizer,
    isAdmin
  });
  const attendLabel = attendButtonLabel(registrationStatus, spots);

  function openCard() {
    onOpenEvent(event.id);
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-xl">
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer"
        onClick={openCard}
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
            keyboardEvent.preventDefault();
            openCard();
          }
        }}
      >
        <div className="relative overflow-hidden rounded-2xl">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-50 text-sm font-medium text-slate-400">
              Без обложки
            </div>
          )}
          {badge && (
            <span className="absolute left-3 top-3 rounded-2xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">
              {badge}
            </span>
          )}
          <button
            type="button"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onToggleFavorite(event.id);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/95 text-lg shadow-md transition hover:scale-105"
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{event.title}</h2>
          <p className="line-clamp-2 text-sm text-slate-500">{event.description}</p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
            <span className="rounded-2xl bg-slate-100 px-3 py-1">{event.category_name}</span>
            {event.event_type === "OFFICIAL" ? (
              <span className="rounded-2xl bg-indigo-50 px-3 py-1 text-indigo-600">Официальное</span>
            ) : (
              <span className="rounded-2xl bg-slate-100 px-3 py-1">От жителей</span>
            )}
            <span className="rounded-2xl bg-slate-100 px-3 py-1">
              {new Date(event.starts_at).toLocaleString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
          {event.organizer_avatar_url ? (
            <img
              src={event.organizer_avatar_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-base font-bold text-slate-900">
              {(event.organizer_name || "?").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <UserLink
                userId={event.created_by}
                name={event.organizer_name}
                onOpenUser={onOpenUser}
                className="text-base font-medium text-slate-900 no-underline hover:text-indigo-600 hover:underline"
              />
              {verified && (
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
                  title="Подтверждённый организатор"
                >
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{platformTenureLabel(event.organizer_member_since)}</p>
            <p className="text-xs font-medium text-indigo-600">{organizerEventsLabel(event.organizer_events_count)}</p>
          </div>
        </div>

        {showContacts && contacts.length > 0 && (
          <div className="mt-3 rounded-2xl bg-[#F5F5F5] px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Связь</p>
            <OrganizerContacts event={event} />
          </div>
        )}
        {token && !showContacts && !isOrganizer && (
          <p className="mt-2 text-xs text-slate-400">Контакты откроются после одобрения заявки</p>
        )}
      </div>

      {(token || canDelete) && (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {token && !isOrganizer && (
            <button
              type="button"
              className="btn-primary px-5 py-2.5 text-xs disabled:opacity-50"
              disabled={spots.isFull && !hasRegistration}
              onClick={() => onAttendAction(event.id, registrationStatus)}
            >
              {attendLabel}
            </button>
          )}
          {token && !isOrganizer && (
            <button
              type="button"
              className="btn-secondary px-4 py-2.5 text-xs"
              onClick={() => onReport(event.id, event.title)}
            >
              Пожаловаться
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn-danger px-4 py-2.5 text-xs" onClick={() => onDeleteEvent(event.id)}>
              Удалить
            </button>
          )}
        </div>
      )}
    </article>
  );
}
