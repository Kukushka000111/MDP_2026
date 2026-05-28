import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { getEventAttendees } from "../api";
import {
  attendButtonLabel,
  canViewEventLocation,
  canViewOrganizerContacts,
  eventLocationLabel,
  eventSpotsInfo,
  isEventOrganizer,
  organizerEventsLabel,
  platformTenureLabel,
  registrationStatusPillClass,
  registrationStatusLabel,
  spotsBadgeText
} from "../utils";
import OrganizerContacts from "./OrganizerContacts";
import UserLink from "./UserLink";

export default function EventDetailSection({
  eventDetails,
  token,
  favorites,
  registrationStatus,
  user,
  myEventIds,
  myEvents,
  reviewsByEvent,
  reviewForm,
  setReviewForm,
  onBack,
  onAttendAction,
  onToggleFavorite,
  onEdit,
  onDelete,
  onOpenReviews,
  onSubmitReview,
  onReport,
  onOpenUser
}) {
  const [attendees, setAttendees] = useState([]);
  const spots = eventSpotsInfo(eventDetails);
  const badge = spotsBadgeText(eventDetails);
  const status = registrationStatus || eventDetails.my_registration_status || null;
  const isApproved = status === "APPROVED";
  const isPending = status === "PENDING";
  const hasRegistration = isApproved || isPending;
  const isOrganizer = isEventOrganizer(eventDetails, user?.id) || myEventIds.has(eventDetails.id);
  const isAdmin = user?.role === "ADMIN";
  const showContacts = canViewOrganizerContacts({
    registrationStatus: status,
    isOrganizer,
    isAdmin
  });
  const showLocation = canViewEventLocation({
    event: eventDetails,
    registrationStatus: status,
    isOrganizer,
    isAdmin
  });
  const eventEnded = new Date(eventDetails.ends_at) <= new Date();
  const canReview = token && isApproved && eventEnded;
  const attendLabel = attendButtonLabel(status, spots);
  const verified = eventDetails.organizer_verified === true || eventDetails.organizer_verified === "t";
  const canLoadAttendees = token && (isApproved || isOrganizer || isAdmin);
  const isFavorite = favorites.includes(eventDetails.id);
  const dateStr = new Date(eventDetails.starts_at).toLocaleString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });

  useEffect(() => {
    if (!canLoadAttendees || !token) {
      setAttendees([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const items = await getEventAttendees(token, eventDetails.id);
        if (!cancelled) setAttendees(items);
      } catch (_error) {
        if (!cancelled) setAttendees([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canLoadAttendees, token, eventDetails.id, status]);

  const primaryAction = token && !isOrganizer && (
    <button
      type="button"
      className={`btn-primary w-full py-3 text-sm disabled:opacity-50 ${
        isPending ? "!bg-amber-500 hover:!bg-amber-600" : ""
      }`}
      disabled={spots.isFull && !hasRegistration}
      onClick={() => onAttendAction(eventDetails.id, status)}
    >
      {attendLabel}
    </button>
  );

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            onClick={onBack}
          >
            <span aria-hidden>←</span> Назад к ленте
          </button>

          {eventDetails.image_url ? (
            <img
              src={eventDetails.image_url}
              alt={eventDetails.title}
              className="aspect-[21/9] w-full rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex aspect-[21/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 text-4xl font-black text-slate-300">
              {eventDetails.title?.charAt(0) || "?"}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl font-black leading-tight text-slate-900">{eventDetails.title}</h1>
              {badge && (
                <span
                  className={`rounded-2xl px-3 py-1 text-xs font-bold ${
                    spots.isFull ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">{dateStr}</p>
            <p className="mt-1 text-sm text-slate-500">
              {eventDetails.category_name}
              {showLocation && eventDetails.address ? ` · ${eventDetails.address}` : ""}
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-500">{eventDetails.description}</p>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Адрес</dt>
              <dd className="mt-1 font-medium text-slate-900">{eventLocationLabel(eventDetails, showLocation)}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Тип</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {eventDetails.event_type === "OFFICIAL" ? "Официальное" : "От жителей"}
              </dd>
            </div>
          </dl>

          {showContacts && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">Контакты организатора</h3>
              <OrganizerContacts event={eventDetails} />
            </div>
          )}

          {!showContacts && !isOrganizer && token && (
            <p className="text-sm text-slate-500">
              Контакты организатора откроются после одобрения вашей заявки.
            </p>
          )}

          {canLoadAttendees && attendees.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Участники ({attendees.length})</h3>
              <ul className="flex flex-wrap gap-2">
                {attendees.map((person) => (
                  <li key={person.id}>
                    <UserLink
                      userId={person.id}
                      name={person.display_name || person.login}
                      avatarUrl={person.avatar_url}
                      onOpenUser={onOpenUser}
                      className="rounded-2xl bg-white px-3 py-1.5 text-sm font-medium shadow-sm ring-1 ring-slate-100"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showLocation
            && Number.isFinite(Number(eventDetails.latitude))
            && Number.isFinite(Number(eventDetails.longitude)) && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
              <MapContainer
                center={[Number(eventDetails.latitude), Number(eventDetails.longitude)]}
                zoom={15}
                style={{ height: "280px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[Number(eventDetails.latitude), Number(eventDetails.longitude)]}>
                  <Popup>{eventDetails.title}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          <div className="border-t border-slate-200 pt-8">
            <h3 className="section-heading text-lg">Отзывы</h3>
            <div className="mt-4 space-y-4">
              {(reviewsByEvent[eventDetails.id] || []).map((review) => (
                <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <p className="font-semibold text-slate-900">
                    {review.display_name} · {review.rating}/5
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{review.body}</p>
                </div>
              ))}
              {(reviewsByEvent[eventDetails.id] || []).length === 0 && (
                <p className="text-sm text-slate-500">Пока нет отзывов.</p>
              )}
            </div>
            <button
              type="button"
              className="mt-4 text-sm font-medium text-indigo-600 hover:underline"
              onClick={() => onOpenReviews(eventDetails.id)}
            >
              Обновить отзывы
            </button>
            {token && (
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                {!isApproved && eventEnded && (
                  <p className="text-xs text-amber-800">Отзыв могут оставить только одобренные участники.</p>
                )}
                {!eventEnded && (
                  <p className="text-xs text-slate-500">Отзыв доступен после завершения мероприятия.</p>
                )}
                <select
                  className="input-field text-sm disabled:bg-slate-50"
                  disabled={!canReview}
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} звёзд
                    </option>
                  ))}
                </select>
                <textarea
                  className="input-field text-sm disabled:bg-slate-50"
                  rows={3}
                  disabled={!canReview}
                  placeholder={canReview ? "Ваш отзыв" : "Запишитесь и дождитесь окончания мероприятия"}
                  value={reviewForm.body}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, body: event.target.value }))}
                />
                <button
                  type="button"
                  disabled={!canReview}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                  onClick={() => onSubmitReview(eventDetails.id, eventDetails.ends_at)}
                >
                  Сохранить отзыв
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-6 space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className={`text-lg font-bold ${spots.isFull && !hasRegistration ? "text-rose-600" : "text-slate-900"}`}>
                {spots.label}
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-100 pt-6">
              {eventDetails.organizer_avatar_url ? (
                <img
                  src={eventDetails.organizer_avatar_url}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-lg font-bold text-slate-900">
                  {(eventDetails.organizer_name || "?").charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <UserLink
                  userId={eventDetails.created_by}
                  name={eventDetails.organizer_name}
                  onOpenUser={onOpenUser}
                  className="text-base font-bold text-slate-900"
                />
                <p className="text-xs text-slate-500">{platformTenureLabel(eventDetails.organizer_member_since)}</p>
                <p className="text-xs text-slate-500">{organizerEventsLabel(eventDetails.organizer_events_count)}</p>
                {verified && (
                  <span className="status-positive mt-1 inline-block px-2 py-0.5 text-xs font-semibold">
                    Подтверждённый организатор
                  </span>
                )}
              </div>
            </div>

            {status && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ваша заявка</p>
                <span
                  className={`mt-1 inline-block px-3 py-1 text-xs font-bold ${registrationStatusPillClass(status)}`}
                >
                  {registrationStatusLabel(status)}
                </span>
                {isPending && eventDetails.my_registration_message && (
                  <p className="mt-2 text-xs text-slate-600">{eventDetails.my_registration_message}</p>
                )}
              </div>
            )}

            {primaryAction}

            {token && isOrganizer && (
              <div className="space-y-3">
                <p className="text-center text-sm text-slate-500">Вы организатор этого мероприятия.</p>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-violet-50 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-100"
                  onClick={() => onEdit(myEvents.find((item) => item.id === eventDetails.id) || eventDetails)}
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-rose-50 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                  onClick={() => onDelete(eventDetails.id)}
                >
                  Удалить
                </button>
              </div>
            )}

            {token && !isOrganizer && isAdmin && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full rounded-2xl bg-violet-50 py-2.5 text-sm font-semibold text-violet-800"
                  onClick={() => onEdit(myEvents.find((item) => item.id === eventDetails.id) || eventDetails)}
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-rose-50 py-2.5 text-sm font-semibold text-rose-700"
                  onClick={() => onDelete(eventDetails.id)}
                >
                  Удалить
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="text-sm font-medium text-slate-500 transition hover:text-indigo-600"
                onClick={() => onToggleFavorite(eventDetails.id)}
              >
                {isFavorite ? "★ В избранном" : "☆ В избранное"}
              </button>
              {onReport && (
                <button
                  type="button"
                  className="text-sm font-medium text-slate-500 transition hover:text-amber-600"
                  onClick={() => onReport(eventDetails.id, eventDetails.title)}
                >
                  Пожаловаться
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
