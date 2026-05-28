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
  registrationStatusClass,
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

  return (
    <section className="mb-4 rounded-lg bg-white p-4 shadow">
      <button type="button" className="mb-3 rounded bg-slate-100 px-2 py-1 text-sm" onClick={onBack}>
        Назад к ленте
      </button>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-semibold">{eventDetails.title}</h2>
        {badge && (
          <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${spots.isFull ? "bg-rose-600 text-white" : "bg-amber-500 text-white"}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600">{eventDetails.description}</p>
      {eventDetails.image_url && (
        <img src={eventDetails.image_url} alt={eventDetails.title} className="mt-3 max-h-80 w-full rounded object-cover" />
      )}
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <p><strong>Категория:</strong> {eventDetails.category_name}</p>
        <p><strong>Адрес:</strong> {eventLocationLabel(eventDetails, showLocation)}</p>
        <div className="sm:col-span-2">
          <div className="flex gap-3 rounded-lg border bg-slate-50 p-3">
            {eventDetails.organizer_avatar_url ? (
              <img src={eventDetails.organizer_avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
                {(eventDetails.organizer_name || "?").charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium">
                <UserLink
                  userId={eventDetails.created_by}
                  name={eventDetails.organizer_name}
                  onOpenUser={onOpenUser}
                  className="text-base font-medium"
                />
              </p>
              <p className="text-xs text-slate-500">{platformTenureLabel(eventDetails.organizer_member_since)}</p>
              <p className="text-xs text-indigo-700">{organizerEventsLabel(eventDetails.organizer_events_count)}</p>
              {verified && (
                <p className="mt-1 text-xs font-medium text-emerald-700">✓ Подтверждённый организатор</p>
              )}
            </div>
          </div>
          {showContacts ? (
            <div className="mt-2">
              <strong>Контакты:</strong>
              <OrganizerContacts event={eventDetails} />
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Контакты организатора откроются после одобрения вашей заявки.
            </p>
          )}
        </div>
        <p><strong>Дата:</strong> {new Date(eventDetails.starts_at).toLocaleString("ru-RU")}</p>
        <p className={spots.isFull && !hasRegistration ? "font-medium text-rose-600" : ""}>
          <strong>Запись:</strong> {spots.label}
        </p>
        {status && (
          <p>
            <strong>Ваша заявка:</strong>{" "}
            <span className={`rounded px-2 py-0.5 text-xs ${registrationStatusClass(status)}`}>
              {registrationStatusLabel(status)}
            </span>
          </p>
        )}
        {isPending && eventDetails.my_registration_message && (
          <p className="sm:col-span-2 text-sm text-slate-600">
            <strong>Ваше сообщение:</strong> {eventDetails.my_registration_message}
          </p>
        )}
      </div>

      {canLoadAttendees && attendees.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <h3 className="mb-2 text-sm font-semibold">Участники ({attendees.length})</h3>
          <ul className="flex flex-wrap gap-2">
            {attendees.map((person) => (
              <li key={person.id}>
                <UserLink
                  userId={person.id}
                  name={person.display_name || person.login}
                  avatarUrl={person.avatar_url}
                  onOpenUser={onOpenUser}
                  className="rounded-full bg-white px-2 py-1 text-sm ring-1 ring-slate-200"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {token && !isOrganizer && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`rounded px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
              isPending ? "bg-amber-100" : "bg-emerald-100"
            }`}
            disabled={spots.isFull && !hasRegistration}
            onClick={() => onAttendAction(eventDetails.id, status)}
          >
            {attendLabel}
          </button>
          <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onToggleFavorite(eventDetails.id)}>
            {favorites.includes(eventDetails.id) ? "Убрать из избранного" : "В избранное"}
          </button>
          {onReport && (
            <button
              className="rounded bg-amber-100 px-2 py-1 text-sm"
              onClick={() => onReport(eventDetails.id, eventDetails.title)}
            >
              Пожаловаться
            </button>
          )}
        </div>
      )}
      {token && isOrganizer && (
        <div className="mt-3 flex flex-wrap gap-2">
          <p className="w-full text-sm text-slate-500">Вы организатор этого мероприятия.</p>
          <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onToggleFavorite(eventDetails.id)}>
            {favorites.includes(eventDetails.id) ? "Убрать из избранного" : "В избранное"}
          </button>
          <button
            className="rounded bg-indigo-100 px-2 py-1 text-sm"
            onClick={() => onEdit(myEvents.find((item) => item.id === eventDetails.id) || eventDetails)}
          >
            Редактировать
          </button>
          <button className="rounded bg-rose-600 px-2 py-1 text-sm text-white" onClick={() => onDelete(eventDetails.id)}>
            Удалить
          </button>
        </div>
      )}
      {token && !isOrganizer && isAdmin && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            className="rounded bg-indigo-100 px-2 py-1 text-sm"
            onClick={() => onEdit(myEvents.find((item) => item.id === eventDetails.id) || eventDetails)}
          >
            Редактировать
          </button>
          <button className="rounded bg-rose-600 px-2 py-1 text-sm text-white" onClick={() => onDelete(eventDetails.id)}>
            Удалить
          </button>
        </div>
      )}
      {showLocation
        && Number.isFinite(Number(eventDetails.latitude))
        && Number.isFinite(Number(eventDetails.longitude)) && (
        <div className="mt-4 overflow-hidden rounded border">
          <MapContainer center={[Number(eventDetails.latitude), Number(eventDetails.longitude)]} zoom={15} style={{ height: "320px", width: "100%" }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[Number(eventDetails.latitude), Number(eventDetails.longitude)]}>
              <Popup>{eventDetails.title}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
      <div className="mt-4 rounded bg-slate-50 p-3">
        <h3 className="mb-2 text-sm font-semibold">Отзывы</h3>
        {(reviewsByEvent[eventDetails.id] || []).map((review) => (
          <div key={review.id} className="mb-1 rounded border bg-white p-2 text-xs">
            <p className="font-medium">{review.display_name} · {review.rating}/5</p>
            <p>{review.body}</p>
          </div>
        ))}
        <button className="mb-2 rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => onOpenReviews(eventDetails.id)}>
          Обновить отзывы
        </button>
        {token && (
          <div className="space-y-1">
            {!isApproved && eventEnded && (
              <p className="text-xs text-amber-800">Отзыв могут оставить только одобренные участники.</p>
            )}
            {!eventEnded && (
              <p className="text-xs text-slate-500">Отзыв доступен после завершения мероприятия.</p>
            )}
            <select
              className="w-full rounded border px-2 py-1 text-xs disabled:bg-slate-100"
              disabled={!canReview}
              value={reviewForm.rating}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}
            >
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <textarea
              className="w-full rounded border px-2 py-1 text-xs disabled:bg-slate-100"
              rows={2}
              disabled={!canReview}
              placeholder={canReview ? "Ваш отзыв" : "Запишитесь на мероприятие и дождитесь его окончания"}
              value={reviewForm.body}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, body: event.target.value }))}
            />
            <button
              disabled={!canReview}
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:bg-slate-400"
              onClick={() => onSubmitReview(eventDetails.id, eventDetails.ends_at)}
            >
              Сохранить отзыв
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
