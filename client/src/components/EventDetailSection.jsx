import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export default function EventDetailSection({
  eventDetails,
  token,
  favorites,
  attendingIds,
  user,
  myEventIds,
  myEvents,
  reviewsByEvent,
  reviewForm,
  setReviewForm,
  onBack,
  onToggleAttend,
  onToggleFavorite,
  onEdit,
  onDelete,
  onOpenReviews,
  onSubmitReview
}) {
  return (
    <section className="mb-4 rounded-lg bg-white p-4 shadow">
      <button type="button" className="mb-3 rounded bg-slate-100 px-2 py-1 text-sm" onClick={onBack}>
        Назад к ленте
      </button>
      <h2 className="text-xl font-semibold">{eventDetails.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{eventDetails.description}</p>
      {eventDetails.image_url && (
        <img src={eventDetails.image_url} alt={eventDetails.title} className="mt-3 max-h-80 w-full rounded object-cover" />
      )}
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <p><strong>Категория:</strong> {eventDetails.category_name}</p>
        <p><strong>Район:</strong> {eventDetails.district_name}</p>
        <p><strong>Адрес:</strong> {eventDetails.address}</p>
        <p><strong>Организатор:</strong> {eventDetails.organizer_name}</p>
        <p><strong>Контакт:</strong> {eventDetails.organizer_contact || "не указан"}</p>
        <p><strong>Дата:</strong> {new Date(eventDetails.starts_at).toLocaleString("ru-RU")}</p>
        <p><strong>Записались:</strong> {eventDetails.registrations_count || 0}</p>
      </div>
      {token && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded bg-emerald-100 px-2 py-1 text-sm" onClick={() => onToggleAttend(eventDetails.id, attendingIds.has(eventDetails.id))}>
            {attendingIds.has(eventDetails.id) ? "Отменить запись" : "Записаться"}
          </button>
          <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onToggleFavorite(eventDetails.id)}>
            {favorites.includes(eventDetails.id) ? "Убрать из избранного" : "В избранное"}
          </button>
          {(user?.role === "ADMIN" || myEventIds.has(eventDetails.id)) && (
            <>
              <button
                className="rounded bg-indigo-100 px-2 py-1 text-sm"
                onClick={() => onEdit(myEvents.find((item) => item.id === eventDetails.id) || eventDetails)}
              >
                Редактировать
              </button>
              <button className="rounded bg-rose-600 px-2 py-1 text-sm text-white" onClick={() => onDelete(eventDetails.id)}>
                Удалить
              </button>
            </>
          )}
        </div>
      )}
      {Number.isFinite(Number(eventDetails.latitude)) && Number.isFinite(Number(eventDetails.longitude)) && (
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
            <select className="w-full rounded border px-2 py-1 text-xs" value={reviewForm.rating} onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <textarea
              className="w-full rounded border px-2 py-1 text-xs"
              rows={2}
              placeholder={new Date(eventDetails.ends_at) <= new Date() ? "Ваш отзыв" : "Отзыв доступен после завершения события"}
              value={reviewForm.body}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, body: event.target.value }))}
            />
            <button
              disabled={new Date(eventDetails.ends_at) > new Date()}
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
