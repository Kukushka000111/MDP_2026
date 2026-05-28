import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  addServerFavorite,
  attendEvent,
  createEvent,
  deleteEvent,
  geocodeAddress,
  getEventDetails,
  getEvents,
  getMe,
  getMeta,
  getModerationQueue,
  getMyAttendingEvents,
  getMyCreatedEvents,
  getMyProfile,
  getParticipants,
  getReviews,
  getServerFavorites,
  leaveEvent,
  login,
  moderateEvent,
  register,
  removeServerFavorite,
  upsertReview
} from "./api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const FAVORITES_KEY = "cultural-navigator:guest-favorites";
const TOKEN_KEY = "cultural-navigator:token";
const PAGES = {
  FEED: "feed",
  EVENT: "event",
  MODERATION: "moderation",
  PROFILE: "profile",
  MY_EVENTS: "my-events",
  ATTENDING: "attending",
  FAVORITES: "favorites"
};

function parseHashRoute() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return { page: PAGES.FEED, eventId: "" };
  if (raw.startsWith("event/")) {
    return { page: PAGES.EVENT, eventId: raw.split("/")[1] || "" };
  }
  if (Object.values(PAGES).includes(raw)) {
    return { page: raw, eventId: "" };
  }
  return { page: PAGES.FEED, eventId: "" };
}

function parseLocalFavorites() {
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return [];
  }
}

function EventPointPicker({ setEventForm }) {
  useMapEvents({
    click(event) {
      setEventForm((prev) => ({
        ...prev,
        latitude: String(event.latlng.lat.toFixed(6)),
        longitude: String(event.latlng.lng.toFixed(6))
      }));
    }
  });
  return null;
}

function isPreciseAddress(address) {
  const normalized = address.trim();
  const hasComma = normalized.includes(",");
  const hasHouseNumber = /\d/.test(normalized);
  return hasComma && hasHouseNumber;
}

export default function App() {
  const initialRoute = parseHashRoute();
  const [page, setPage] = useState(initialRoute.page);
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [routeEventId, setRouteEventId] = useState(initialRoute.eventId);
  const [meta, setMeta] = useState({ categories: [], districts: [] });
  const [favorites, setFavorites] = useState(parseLocalFavorites);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [myAttending, setMyAttending] = useState([]);
  const [participantsByEvent, setParticipantsByEvent] = useState({});
  const [authForm, setAuthForm] = useState({ mode: "login", email: "", password: "", displayName: "" });
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    districtId: "",
    address: "",
    latitude: "",
    longitude: "",
    organizerName: "",
    organizerContact: "",
    imageUrl: "",
    startsAt: "",
    endsAt: "",
    eventType: "COMMUNITY"
  });
  function navigate(nextPage, eventId = "") {
    if (nextPage === PAGES.EVENT && eventId) {
      window.location.hash = `event/${eventId}`;
      return;
    }
    window.location.hash = nextPage;
  }

  useEffect(() => {
    function onHashChange() {
      const route = parseHashRoute();
      setPage(route.page);
      setRouteEventId(route.eventId);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    (async () => {
      if (page !== PAGES.EVENT || !routeEventId) return;
      try {
        setEventDetails(await getEventDetails(routeEventId));
      } catch (_error) {
        setEventDetails(null);
      }
    })();
  }, [page, routeEventId]);

  const [queue, setQueue] = useState([]);
  const [activeEventId, setActiveEventId] = useState("");
  const [reviewsByEvent, setReviewsByEvent] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, body: "" });
  const [geocodeCandidates, setGeocodeCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: "", categoryId: "", districtId: "", dateFrom: "", dateTo: "" });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    (async () => setMeta(await getMeta()))();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setEvents(await getEvents(filters));
      setLoading(false);
    })();
  }, [filters]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      localStorage.setItem(TOKEN_KEY, token);
      const me = await getMe(token);
      setUser(me.user);
      for (const eventId of favorites) {
        await addServerFavorite(token, eventId);
      }
      setFavorites(await getServerFavorites(token));
      const [profile, created, attending] = await Promise.all([
        getMyProfile(token),
        getMyCreatedEvents(token),
        getMyAttendingEvents(token)
      ]);
      setMyProfile(profile);
      setMyEvents(created);
      setMyAttending(attending);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    (async () => {
      if (!token || user?.role !== "ADMIN") return;
      setQueue(await getModerationQueue(token));
    })();
  }, [token, user]);

  const visibleEvents = events.filter((event) => {
    const byName = filters.q ? event.title.toLowerCase().includes(filters.q.toLowerCase()) : true;
    const byCategory = filters.categoryId ? event.category_id === filters.categoryId : true;
    const byDistrict = filters.districtId ? event.district_id === filters.districtId : true;
    const startsAt = new Date(event.starts_at);
    const byFrom = filters.dateFrom ? startsAt >= new Date(filters.dateFrom) : true;
    const byTo = filters.dateTo ? startsAt <= new Date(filters.dateTo) : true;
    return byName && byCategory && byDistrict && byFrom && byTo;
  });

  const canReviewMap = useMemo(
    () => Object.fromEntries(visibleEvents.map((event) => [event.id, new Date(event.ends_at) <= new Date()])),
    [visibleEvents]
  );
  const attendingIds = useMemo(() => new Set(myAttending.map((item) => item.id)), [myAttending]);
  const favoriteEvents = useMemo(
    () => visibleEvents.filter((event) => favorites.includes(event.id)),
    [visibleEvents, favorites]
  );
  const myEventIds = useMemo(() => new Set(myEvents.map((item) => item.id)), [myEvents]);

  async function toggleFavorite(id) {
    const isActive = favorites.includes(id);
    if (!token) {
      setFavorites((prev) => (isActive ? prev.filter((item) => item !== id) : [...prev, id]));
      return;
    }
    if (isActive) await removeServerFavorite(token, id);
    else await addServerFavorite(token, id);
    setFavorites(await getServerFavorites(token));
  }

  async function toggleAttend(eventId, isAttending) {
    if (!token) return;
    if (isAttending) await leaveEvent(token, eventId);
    else await attendEvent(token, eventId);
    setMyAttending(await getMyAttendingEvents(token));
    setEvents(await getEvents(filters));
  }

  async function onAuthSubmit(event) {
    event.preventDefault();
    try {
      const result = authForm.mode === "register"
        ? await register({ email: authForm.email, password: authForm.password, displayName: authForm.displayName })
        : await login({ email: authForm.email, password: authForm.password });
      setToken(result.token);
      setAuthForm((prev) => ({ ...prev, password: "" }));
    } catch (_error) {
      // no-op
    }
  }

  function logout() {
    setToken("");
    setUser(null);
    setMyProfile(null);
    setMyEvents([]);
    setMyAttending([]);
    localStorage.removeItem(TOKEN_KEY);
    setFavorites(parseLocalFavorites());
    navigate(PAGES.FEED);
  }

  async function submitEvent(event) {
    event.preventDefault();
    if (!token) return;
    await createEvent(token, {
      ...eventForm,
      latitude: eventForm.latitude ? Number(eventForm.latitude) : null,
      longitude: eventForm.longitude ? Number(eventForm.longitude) : null,
      startsAt: new Date(eventForm.startsAt).toISOString(),
      endsAt: new Date(eventForm.endsAt).toISOString(),
      imageUrl: eventForm.imageUrl || ""
    });
    setEventForm({
      title: "", description: "", categoryId: "", districtId: "", address: "", latitude: "", longitude: "",
      organizerName: "", organizerContact: "", startsAt: "", endsAt: "", eventType: "COMMUNITY", imageUrl: ""
    });
    setEvents(await getEvents(filters));
    setMyEvents(await getMyCreatedEvents(token));
  }

  async function applyModeration(eventId, status) {
    if (!token) return;
    await moderateEvent(token, eventId, {
      status,
      moderationComment: status === "NEEDS_EDIT" ? "Нужно уточнить данные" : ""
    });
    setQueue(await getModerationQueue(token));
    setEvents(await getEvents(filters));
  }

  async function geocodeCurrentAddress() {
    if (!isPreciseAddress(eventForm.address)) {
      return;
    }
    const query = /омск/i.test(eventForm.address)
      ? eventForm.address
      : `Омск, ${eventForm.address}`;
    const result = await geocodeAddress(query);
    if (!result) return;
    setGeocodeCandidates(result);
  }

  function applyGeocodeCandidate(candidate) {
    setEventForm((prev) => ({
      ...prev,
      latitude: String(candidate.latitude),
      longitude: String(candidate.longitude)
    }));
    setGeocodeCandidates([]);
  }

  async function openReviews(eventId) {
    setActiveEventId((prev) => (prev === eventId ? "" : eventId));
    if (reviewsByEvent[eventId]) return;
    try {
      const items = await getReviews(eventId);
      setReviewsByEvent((prev) => ({ ...prev, [eventId]: items }));
    } catch (_error) {
      setReviewsByEvent((prev) => ({ ...prev, [eventId]: [] }));
    }
  }

  async function submitReview(eventId, eventEnd) {
    if (!token || new Date(eventEnd) > new Date()) return;
    await upsertReview(token, { eventId, rating: Number(reviewForm.rating), body: reviewForm.body });
    const items = await getReviews(eventId);
    setReviewsByEvent((prev) => ({ ...prev, [eventId]: items }));
    setReviewForm({ rating: 5, body: "" });
  }

  async function showParticipants(eventId) {
    if (!token) return;
    const items = await getParticipants(token, eventId);
    setParticipantsByEvent((prev) => ({ ...prev, [eventId]: items }));
  }

  async function openEventPage(eventId) {
    navigate(PAGES.EVENT, eventId);
  }

  async function onDeleteEvent(eventId) {
    if (!token) return;
    await deleteEvent(token, eventId);
    setEvents(await getEvents(filters));
    setMyEvents(await getMyCreatedEvents(token));
    if (page === PAGES.EVENT) navigate(PAGES.FEED);
  }

  return (
    <div className="min-h-full">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Культурный Навигатор</h1>
            <p className="text-sm text-slate-300">Лента событий и интерактивная карта</p>
          </div>
          {!token ? (
            <form onSubmit={onAuthSubmit} className="flex flex-wrap items-center gap-2">
              {authForm.mode === "register" && (
                <input className="rounded px-2 py-1 text-sm text-slate-900" placeholder="Имя" value={authForm.displayName} onChange={(event) => setAuthForm((prev) => ({ ...prev, displayName: event.target.value }))} />
              )}
              <input className="rounded px-2 py-1 text-sm text-slate-900" placeholder="Email" value={authForm.email} onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))} />
              <input className="rounded px-2 py-1 text-sm text-slate-900" type="password" placeholder="Пароль" value={authForm.password} onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))} />
              <button type="submit" className="rounded bg-blue-500 px-2 py-1 text-sm">{authForm.mode === "register" ? "Регистрация" : "Вход"}</button>
              <button type="button" className="rounded bg-slate-700 px-2 py-1 text-sm" onClick={() => setAuthForm((prev) => ({ ...prev, mode: prev.mode === "register" ? "login" : "register" }))}>
                {authForm.mode === "register" ? "Есть аккаунт" : "Создать"}
              </button>
            </form>
          ) : (
            <button type="button" onClick={logout} className="rounded bg-rose-600 px-2 py-1 text-sm">Выход</button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        {token && (
          <section className="mb-4 flex flex-wrap gap-2 rounded-lg bg-white p-3 shadow">
            <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => navigate(PAGES.FEED)}>Лента</button>
            <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => navigate(PAGES.PROFILE)}>Аккаунт</button>
            <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => navigate(PAGES.MY_EVENTS)}>Мои мероприятия</button>
            <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => navigate(PAGES.ATTENDING)}>Куда я записан</button>
            <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => navigate(PAGES.FAVORITES)}>Избранное</button>
            {user?.role === "ADMIN" && <button className="rounded bg-amber-100 px-2 py-1 text-sm" onClick={() => navigate(PAGES.MODERATION)}>Панель модератора</button>}
          </section>
        )}

        <section className="mb-3 text-xs text-slate-500">
          <span className="rounded bg-slate-100 px-2 py-1">Главная</span>
          {page !== PAGES.FEED && <span> / </span>}
          {page !== PAGES.FEED && <span className="rounded bg-slate-100 px-2 py-1">{page === PAGES.EVENT ? "Мероприятие" : page}</span>}
        </section>

        {page === PAGES.PROFILE && token && myProfile && (
          <section className="mb-4 rounded-lg bg-white p-4 shadow text-sm">
            <h2 className="mb-2 text-lg font-semibold">Мой аккаунт</h2>
            <p><strong>Имя:</strong> {myProfile.display_name}</p>
            <p><strong>Email:</strong> {myProfile.email}</p>
            <p><strong>Роль:</strong> {myProfile.role}</p>
          </section>
        )}

        {page === PAGES.EVENT && eventDetails && (
          <section className="mb-4 rounded-lg bg-white p-4 shadow">
            <button
              type="button"
              className="mb-3 rounded bg-slate-100 px-2 py-1 text-sm"
              onClick={() => navigate(PAGES.FEED)}
            >
              Назад к ленте
            </button>
            <h2 className="text-xl font-semibold">{eventDetails.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{eventDetails.description}</p>
            {eventDetails.image_url && (
              <img
                src={eventDetails.image_url}
                alt={eventDetails.title}
                className="mt-3 max-h-80 w-full rounded object-cover"
              />
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
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded bg-emerald-100 px-2 py-1 text-sm"
                  onClick={() => toggleAttend(eventDetails.id, attendingIds.has(eventDetails.id))}
                >
                  {attendingIds.has(eventDetails.id) ? "Отменить запись" : "Записаться"}
                </button>
                <button
                  className="rounded bg-slate-100 px-2 py-1 text-sm"
                  onClick={() => toggleFavorite(eventDetails.id)}
                >
                  {favorites.includes(eventDetails.id) ? "Убрать из избранного" : "В избранное"}
                </button>
                {(user?.role === "ADMIN" || myEventIds.has(eventDetails.id)) && (
                  <button
                    className="rounded bg-rose-600 px-2 py-1 text-sm text-white"
                    onClick={() => onDeleteEvent(eventDetails.id)}
                  >
                    Удалить мероприятие
                  </button>
                )}
              </div>
            )}
            {Number.isFinite(Number(eventDetails.latitude)) && Number.isFinite(Number(eventDetails.longitude)) && (
              <div className="mt-4 overflow-hidden rounded border">
                <MapContainer
                  center={[Number(eventDetails.latitude), Number(eventDetails.longitude)]}
                  zoom={15}
                  style={{ height: "320px", width: "100%" }}
                >
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
              <button
                className="mb-2 rounded bg-slate-200 px-2 py-1 text-xs"
                onClick={() => openReviews(eventDetails.id)}
              >
                Обновить отзывы
              </button>
              {token && (
                <div className="space-y-1">
                  <select className="w-full rounded border px-2 py-1 text-xs" value={reviewForm.rating} onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}>
                    {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <textarea className="w-full rounded border px-2 py-1 text-xs" rows={2} placeholder={new Date(eventDetails.ends_at) <= new Date() ? "Ваш отзыв" : "Отзыв доступен после завершения события"} value={reviewForm.body} onChange={(event) => setReviewForm((prev) => ({ ...prev, body: event.target.value }))} />
                  <button disabled={new Date(eventDetails.ends_at) > new Date()} className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:bg-slate-400" onClick={() => submitReview(eventDetails.id, eventDetails.ends_at)}>
                    Сохранить отзыв
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {page === PAGES.MY_EVENTS && token && (
          <section className="mb-4 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Мои мероприятия</h2>
            {myEvents.map((item) => (
              <div key={item.id} className="mb-2 rounded border p-2">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">{item.moderation_status} · записались: {item.registrations_count}</p>
                <button className="mt-1 rounded bg-slate-100 px-2 py-1 text-xs" onClick={() => showParticipants(item.id)}>Кто идет</button>
                {(participantsByEvent[item.id] || []).map((person) => <p key={person.id} className="text-xs">{person.display_name} ({person.email})</p>)}
              </div>
            ))}
            {myEvents.length === 0 && <p className="text-sm text-slate-500">Пока нет созданных мероприятий.</p>}
          </section>
        )}

        {page === PAGES.ATTENDING && token && (
          <section className="mb-4 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Куда я записан</h2>
            {myAttending.map((item) => (
              <div key={item.id} className="mb-2 rounded border p-2">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">{new Date(item.starts_at).toLocaleString("ru-RU")}</p>
              </div>
            ))}
            {myAttending.length === 0 && <p className="text-sm text-slate-500">Список пуст.</p>}
          </section>
        )}

        {page === PAGES.FAVORITES && (
          <section className="mb-4 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Избранное</h2>
            {favoriteEvents.map((item) => (
              <div key={item.id} className="mb-2 rounded border p-2">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">{item.category_name} · {item.district_name}</p>
              </div>
            ))}
            {favoriteEvents.length === 0 && <p className="text-sm text-slate-500">Избранное пусто.</p>}
          </section>
        )}

        {page === PAGES.MODERATION && user?.role === "ADMIN" && (
          <section className="mb-4 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Панель модератора</h2>
            {queue.map((item) => (
              <div key={item.id} className="mb-2 rounded border p-2">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">{item.created_by_name} · {item.moderation_status}</p>
                <div className="mt-2 flex gap-2">
                  <button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={() => applyModeration(item.id, "APPROVED")}>Approve</button>
                  <button className="rounded bg-amber-500 px-2 py-1 text-xs text-white" onClick={() => applyModeration(item.id, "NEEDS_EDIT")}>Needs edit</button>
                  <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={() => applyModeration(item.id, "REJECTED")}>Reject</button>
                </div>
              </div>
            ))}
            {queue.length === 0 && <p className="text-sm text-slate-500">Очередь пуста.</p>}
          </section>
        )}

        {(page === PAGES.FEED || !token) && token && (
          <section className="mb-4 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Создать событие</h2>
            <form onSubmit={submitEvent} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input className="rounded border px-2 py-1" placeholder="Название" value={eventForm.title} onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input className="rounded border px-2 py-1" placeholder="Адрес" value={eventForm.address} onChange={(event) => setEventForm((prev) => ({ ...prev, address: event.target.value }))} required />
              <input className="rounded border px-2 py-1" placeholder="Организатор" value={eventForm.organizerName} onChange={(event) => setEventForm((prev) => ({ ...prev, organizerName: event.target.value }))} required />
              <input className="rounded border px-2 py-1" placeholder="Контакт" value={eventForm.organizerContact} onChange={(event) => setEventForm((prev) => ({ ...prev, organizerContact: event.target.value }))} />
              <input className="rounded border px-2 py-1" placeholder="URL фото (опционально)" value={eventForm.imageUrl} onChange={(event) => setEventForm((prev) => ({ ...prev, imageUrl: event.target.value }))} />
              <input
                type="file"
                accept="image/*"
                className="rounded border px-2 py-1 text-xs"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setEventForm((prev) => ({ ...prev, imageUrl: String(reader.result || "") }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <select className="rounded border px-2 py-1" value={eventForm.categoryId} onChange={(event) => setEventForm((prev) => ({ ...prev, categoryId: event.target.value }))} required>
                <option value="">Категория</option>
                {meta.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select className="rounded border px-2 py-1" value={eventForm.districtId} onChange={(event) => setEventForm((prev) => ({ ...prev, districtId: event.target.value }))} required>
                <option value="">Район</option>
                {meta.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input type="datetime-local" className="rounded border px-2 py-1" value={eventForm.startsAt} onChange={(event) => setEventForm((prev) => ({ ...prev, startsAt: event.target.value }))} required />
              <input type="datetime-local" className="rounded border px-2 py-1" value={eventForm.endsAt} onChange={(event) => setEventForm((prev) => ({ ...prev, endsAt: event.target.value }))} required />
              <input className="rounded border px-2 py-1" placeholder="Широта" value={eventForm.latitude} onChange={(event) => setEventForm((prev) => ({ ...prev, latitude: event.target.value }))} />
              <input className="rounded border px-2 py-1" placeholder="Долгота" value={eventForm.longitude} onChange={(event) => setEventForm((prev) => ({ ...prev, longitude: event.target.value }))} />
              <select className="rounded border px-2 py-1" value={eventForm.eventType} onChange={(event) => setEventForm((prev) => ({ ...prev, eventType: event.target.value }))}>
                <option value="COMMUNITY">От жителей</option>
                <option value="OFFICIAL">Официальное</option>
              </select>
              <input className="rounded border px-2 py-1 sm:col-span-2 lg:col-span-3" placeholder="Описание" value={eventForm.description} onChange={(event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))} />
              <button type="button" className="rounded bg-slate-200 px-2 py-1 text-sm" onClick={geocodeCurrentAddress}>Определить точку по адресу</button>
              <button type="submit" className="rounded bg-emerald-600 px-2 py-1 text-white">Отправить</button>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              Для точного поиска пишите полный адрес: город, улица, дом. Например: "Омск, Ленина, 10".
            </p>
            {geocodeCandidates.length > 0 && (
              <div className="mt-2 rounded border p-2">
                <p className="mb-1 text-xs font-medium">Выберите точный адрес:</p>
                <div className="space-y-1">
                  {geocodeCandidates.map((candidate) => (
                    <button
                      key={`${candidate.latitude}-${candidate.longitude}`}
                      type="button"
                      className="block w-full rounded bg-slate-100 px-2 py-1 text-left text-xs"
                      onClick={() => applyGeocodeCandidate(candidate)}
                    >
                      {candidate.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">Либо кликните на карту ниже, чтобы выбрать точку вручную.</p>
          </section>
        )}

        {(page === PAGES.FEED || !token) && (
          <>
            <section className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-5">
              <input className="rounded border border-slate-300 px-3 py-2" placeholder="Поиск по названию" value={filters.q} onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))} />
              <select className="rounded border border-slate-300 px-3 py-2" value={filters.categoryId} onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value }))}>
                <option value="">Все категории</option>
                {meta.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select className="rounded border border-slate-300 px-3 py-2" value={filters.districtId} onChange={(event) => setFilters((prev) => ({ ...prev, districtId: event.target.value }))}>
                <option value="">Все районы</option>
                {meta.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input type="date" className="rounded border border-slate-300 px-3 py-2" value={filters.dateFrom} onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))} />
              <input type="date" className="rounded border border-slate-300 px-3 py-2" value={filters.dateTo} onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))} />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="space-y-3 lg:col-span-2">
                {loading && <p className="rounded bg-white p-3 shadow">Загрузка событий...</p>}
                {!loading && visibleEvents.length === 0 && <p className="rounded bg-white p-3 shadow">События не найдены.</p>}
                {visibleEvents.map((event) => (
                  <article key={event.id} className="rounded-lg bg-white p-4 shadow">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold">{event.title}</h2>
                      <button type="button" onClick={() => toggleFavorite(event.id)} className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">
                        {favorites.includes(event.id) ? "В избранном" : "В избранное"}
                      </button>
                    </div>
                    <p className="mb-2 text-sm text-slate-600">{event.description}</p>
                    <p className="text-xs text-slate-500">{event.category_name} · {event.district_name}</p>
                    <p className="text-xs text-slate-500">{new Date(event.starts_at).toLocaleString("ru-RU")}</p>
                    <p className="text-xs text-slate-500">Записались: {event.registrations_count || 0}</p>
                    <div className="mt-2 flex gap-2">
                      <button className="rounded bg-indigo-100 px-2 py-1 text-xs" onClick={() => openEventPage(event.id)}>
                        Подробнее
                      </button>
                      {token && (
                        <button className="rounded bg-emerald-100 px-2 py-1 text-xs" onClick={() => toggleAttend(event.id, attendingIds.has(event.id))}>
                          {attendingIds.has(event.id) ? "Отменить запись" : "Записаться"}
                        </button>
                      )}
                      {(user?.role === "ADMIN" || myEventIds.has(event.id)) && (
                        <button className="rounded bg-rose-100 px-2 py-1 text-xs" onClick={() => onDeleteEvent(event.id)}>
                          Удалить
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg bg-white shadow lg:col-span-3">
                <MapContainer center={[54.9885, 73.3242]} zoom={12} style={{ height: "70vh", width: "100%" }}>
                  <EventPointPicker setEventForm={setEventForm} />
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {eventForm.latitude && eventForm.longitude && (
                    <Marker position={[Number(eventForm.latitude), Number(eventForm.longitude)]}>
                      <Popup>Точка нового события</Popup>
                    </Marker>
                  )}
                  {visibleEvents
                    .filter((event) => Number.isFinite(Number(event.latitude)) && Number.isFinite(Number(event.longitude)))
                    .map((event) => (
                      <Marker key={event.id} position={[Number(event.latitude), Number(event.longitude)]}>
                        <Popup>
                          <strong>{event.title}</strong>
                          <br />
                          {event.district_name}
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
