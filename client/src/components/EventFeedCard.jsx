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
    <article className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-slate-100">
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
        <div className="relative">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400">
              Без обложки
            </div>
          )}
          {badge && (
            <span
              className={`absolute left-2 top-2 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow ${
                spots.isFull && !hasRegistration ? "bg-rose-600 text-white" : "bg-amber-500 text-white animate-pulse"
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold leading-snug text-slate-900">{event.title}</h2>
            <button
              type="button"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onToggleFavorite(event.id);
              }}
              className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
            >
              {isFavorite ? "★" : "☆"}
            </button>
          </div>

          <p className="mb-2 text-sm text-slate-600 line-clamp-2">{event.description}</p>
          <p className="text-xs text-slate-500">
            {event.category_name}
            {event.event_type === "OFFICIAL" ? " · Официальное" : " · От жителей"}
          </p>
          <p className="text-xs text-slate-500">{new Date(event.starts_at).toLocaleString("ru-RU")}</p>

          <div className="mt-3 flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2">
            {event.organizer_avatar_url ? (
              <img
                src={event.organizer_avatar_url}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {(event.organizer_name || "?").charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 text-xs">
              <UserLink
                userId={event.created_by}
                name={event.organizer_name}
                onOpenUser={onOpenUser}
                className="font-medium text-slate-800 no-underline hover:underline"
              />
              <p className="text-slate-500">{platformTenureLabel(event.organizer_member_since)}</p>
              <p className="mt-0.5 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-800">
                {organizerEventsLabel(event.organizer_events_count)}
              </p>
              {verified && (
                <p className="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">
                  ✓ Подтверждённый организатор
                </p>
              )}
            </div>
          </div>

          {showContacts && contacts.length > 0 && (
            <div className="mt-2 rounded border border-slate-100 px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
              <p className="mb-1 text-xs font-medium text-slate-600">Быстрая связь</p>
              <OrganizerContacts event={event} />
            </div>
          )}
          {token && !showContacts && !isOrganizer && (
            <p className="mt-2 text-xs text-slate-400">Контакты — после одобрения заявки</p>
          )}
        </div>
      </div>

      {(token || canDelete) && (
        <div className="flex flex-wrap gap-2 border-t border-slate-50 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
          {token && !isOrganizer && (
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs text-white disabled:opacity-50 ${
                registrationStatus === "PENDING" ? "bg-amber-600" : "bg-emerald-600"
              }`}
              disabled={spots.isFull && !hasRegistration}
              onClick={() => onAttendAction(event.id, registrationStatus)}
            >
              {attendLabel}
            </button>
          )}
          {token && !isOrganizer && (
            <button
              type="button"
              className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-900 ring-1 ring-amber-200"
              onClick={() => onReport(event.id, event.title)}
            >
              Пожаловаться
            </button>
          )}
          {canDelete && (
            <button type="button" className="rounded bg-rose-100 px-2 py-1 text-xs" onClick={() => onDeleteEvent(event.id)}>
              Удалить
            </button>
          )}
        </div>
      )}
    </article>
  );
}
