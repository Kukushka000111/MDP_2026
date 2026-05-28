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
  compact = false,
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

  const shellClass = compact
    ? "flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-indigo-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-800"
    : "flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-900";

  return (
    <article className={shellClass}>
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
        <div className={`relative overflow-hidden ${compact ? "rounded-xl" : "rounded-2xl"}`}>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-50 text-xs font-medium text-slate-400">
              Без обложки
            </div>
          )}
          {badge && (
            <span
              className={`absolute left-2 top-2 rounded-xl bg-indigo-600 font-bold text-white shadow-md ${
                compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1.5 text-xs"
              }`}
            >
              {badge}
            </span>
          )}
          <button
            type="button"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onToggleFavorite(event.id);
            }}
            className={`absolute right-2 top-2 flex items-center justify-center rounded-xl bg-white/95 shadow-md transition hover:scale-105 ${
              compact ? "h-7 w-7 text-sm" : "h-9 w-9 text-lg"
            }`}
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>

        <div className={compact ? "mt-2 space-y-1" : "mt-4 space-y-2"}>
          <h2
            className={`font-bold tracking-tight text-slate-900 ${
              compact ? "line-clamp-2 text-sm leading-snug" : "text-xl font-extrabold"
            }`}
          >
            {event.title}
          </h2>
          <p className={`text-slate-500 ${compact ? "line-clamp-2 text-xs" : "line-clamp-2 text-sm"}`}>
            {event.description}
          </p>
          <div className={`flex flex-wrap gap-1.5 font-medium text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5">{event.category_name}</span>
            {event.event_type === "OFFICIAL" ? (
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-indigo-600">Официальное</span>
            ) : (
              <span className="rounded-lg bg-slate-100 px-2 py-0.5">От жителей</span>
            )}
            <span className="rounded-lg bg-slate-100 px-2 py-0.5">
              {new Date(event.starts_at).toLocaleString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 border-t border-slate-100 ${
            compact ? "mt-2 pt-2" : "mt-4 gap-3 pt-4"
          }`}
        >
          {event.organizer_avatar_url ? (
            <img
              src={event.organizer_avatar_url}
              alt=""
              className={`shrink-0 rounded-full object-cover ring-2 ring-white ${
                compact ? "h-8 w-8" : "h-12 w-12"
              }`}
            />
          ) : (
            <div
              className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-slate-900 ${
                compact ? "h-8 w-8 text-xs" : "h-12 w-12 text-base"
              }`}
            >
              {(event.organizer_name || "?").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <UserLink
                userId={event.created_by}
                name={event.organizer_name}
                onOpenUser={onOpenUser}
                className={`font-medium text-slate-900 no-underline hover:text-indigo-600 hover:underline ${
                  compact ? "text-xs" : "text-base"
                }`}
              />
              {verified && (
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white"
                  title="Подтверждённый организатор"
                >
                  ✓
                </span>
              )}
            </div>
            {!compact && (
              <>
                <p className="text-xs text-slate-500">{platformTenureLabel(event.organizer_member_since)}</p>
                <p className="text-xs font-medium text-indigo-600">
                  {organizerEventsLabel(event.organizer_events_count)}
                </p>
              </>
            )}
          </div>
        </div>

        {!compact && showContacts && contacts.length > 0 && (
          <div className="surface-muted mt-3 px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Связь</p>
            <OrganizerContacts event={event} />
          </div>
        )}
        {!compact && token && !showContacts && !isOrganizer && (
          <p className="mt-2 text-xs text-slate-400">Контакты откроются после одобрения заявки</p>
        )}
      </div>

      {(token || canDelete) && (
        <div
          className={`flex flex-wrap gap-1.5 ${compact ? "" : "gap-2"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {token && !isOrganizer && (
            <button
              type="button"
              className={`btn-primary disabled:opacity-50 ${compact ? "px-3 py-1.5 text-[10px]" : "px-5 py-2.5 text-xs"}`}
              disabled={spots.isFull && !hasRegistration}
              onClick={() => onAttendAction(event.id, registrationStatus)}
            >
              {attendLabel}
            </button>
          )}
          {token && !isOrganizer && !compact && (
            <button
              type="button"
              className="btn-secondary px-4 py-2.5 text-xs"
              onClick={() => onReport(event.id, event.title)}
            >
              Пожаловаться
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className={`btn-danger ${compact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2.5 text-xs"}`}
              onClick={() => onDeleteEvent(event.id)}
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </article>
  );
}
