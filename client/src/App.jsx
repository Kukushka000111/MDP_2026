import { useCallback, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  addServerFavorite,
  attendEvent,
  checkApiHealth,
  createEvent,
  deleteEvent,
  geocodeAddress,
  getAdminStats,
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
  updateEvent,
  upsertReview
} from "./api";
import AppHeader from "./components/AppHeader";
import AppNav from "./components/AppNav";
import EventDetailSection from "./components/EventDetailSection";
import EventFormSection from "./components/EventFormSection";
import FeedSection from "./components/FeedSection";
import ModerationPanel from "./components/ModerationPanel";
import MyEventsSection from "./components/MyEventsSection";
import Toast from "./Toast";
import { FAVORITES_KEY, PAGE_SIZE, PAGE_TITLES, PAGES, TOKEN_KEY } from "./constants";
import { EMPTY_EVENT_FORM, readImageFileAsDataUrl, toDatetimeLocalValue } from "./utils";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

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
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [adminStats, setAdminStats] = useState(null);
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
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [editingEventId, setEditingEventId] = useState("");
  const [apiOffline, setApiOffline] = useState(false);
  const [metaError, setMetaError] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [moderationFilter, setModerationFilter] = useState("");
  const [moderationComments, setModerationComments] = useState({});
  const [debouncedQ, setDebouncedQ] = useState("");
  const [queue, setQueue] = useState([]);
  const [activeEventId, setActiveEventId] = useState("");
  const [reviewsByEvent, setReviewsByEvent] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, body: "" });
  const [geocodeCandidates, setGeocodeCandidates] = useState([]);
  const [eventSubmitMessage, setEventSubmitMessage] = useState("");
  const [eventSubmitError, setEventSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: "", categoryId: "", districtId: "", dateFrom: "", dateTo: "" });

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

  function showToast(message, type = "info") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  useEffect(() => {
    (async () => {
      if (page !== PAGES.EVENT || !routeEventId) return;
      try {
        setEventDetails(await getEventDetails(routeEventId, token));
      } catch (_error) {
        setEventDetails(null);
      }
    })();
  }, [page, routeEventId, token]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    (async () => {
      try {
        const healthy = await checkApiHealth();
        setApiOffline(!healthy);
      } catch (_error) {
        setApiOffline(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setMeta(await getMeta());
        setMetaError(false);
      } catch (_error) {
        setMetaError(true);
      }
    })();
  }, []);

  const loadEvents = useCallback(async (page) => {
    setLoading(true);
    try {
      const result = await getEvents(
        { ...filters, q: debouncedQ },
        { page, limit: PAGE_SIZE }
      );
      setEvents(result.items);
      setEventsTotal(result.total);
      setEventsPage(result.page);
      setEventsTotalPages(result.totalPages);
      setApiOffline(false);
    } catch (_error) {
      setEvents([]);
      setEventsTotal(0);
      setEventsTotalPages(1);
      setApiOffline(true);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedQ]);

  useEffect(() => {
    setEventsPage(1);
  }, [filters.categoryId, filters.districtId, filters.dateFrom, filters.dateTo, debouncedQ]);

  useEffect(() => {
    loadEvents(eventsPage);
  }, [loadEvents, eventsPage]);

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
      try {
        const [queueItems, stats] = await Promise.all([
          getModerationQueue(token, moderationFilter),
          getAdminStats(token)
        ]);
        setQueue(queueItems);
        setAdminStats(stats);
      } catch (error) {
        showToast(error.message, "error");
      }
    })();
  }, [token, user, moderationFilter]);

  const attendingIds = useMemo(() => new Set(myAttending.map((item) => item.id)), [myAttending]);
  const favoriteEvents = useMemo(
    () => events.filter((event) => favorites.includes(event.id)),
    [events, favorites]
  );
  const myEventIds = useMemo(() => new Set(myEvents.map((item) => item.id)), [myEvents]);

  async function toggleFavorite(id) {
    const isActive = favorites.includes(id);
    if (!token) {
      setFavorites((prev) => (isActive ? prev.filter((item) => item !== id) : [...prev, id]));
      showToast(isActive ? "Убрано из избранного" : "Добавлено в избранное");
      return;
    }
    try {
      if (isActive) await removeServerFavorite(token, id);
      else await addServerFavorite(token, id);
      setFavorites(await getServerFavorites(token));
      showToast(isActive ? "Убрано из избранного" : "Добавлено в избранное", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function toggleAttend(eventId, isAttending) {
    if (!token) return;
    try {
      if (isAttending) await leaveEvent(token, eventId);
      else await attendEvent(token, eventId);
      setMyAttending(await getMyAttendingEvents(token));
      await loadEvents(eventsPage);
      showToast(isAttending ? "Запись отменена" : "Вы записаны на мероприятие", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function onAuthSubmit(event) {
    event.preventDefault();
    try {
      const result = authForm.mode === "register"
        ? await register({ email: authForm.email, password: authForm.password, displayName: authForm.displayName })
        : await login({ email: authForm.email, password: authForm.password });
      setToken(result.token);
      setAuthForm((prev) => ({ ...prev, password: "" }));
      showToast(authForm.mode === "register" ? "Регистрация успешна" : "Вход выполнен", "success");
    } catch (error) {
      showToast(error.message, "error");
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

  function buildEventPayload() {
    return {
      ...eventForm,
      latitude: eventForm.latitude ? Number(eventForm.latitude) : null,
      longitude: eventForm.longitude ? Number(eventForm.longitude) : null,
      startsAt: new Date(eventForm.startsAt).toISOString(),
      endsAt: new Date(eventForm.endsAt).toISOString(),
      imageUrl: eventForm.imageUrl || ""
    };
  }

  function resetEventForm() {
    setEventForm(EMPTY_EVENT_FORM);
    setEditingEventId("");
    setGeocodeCandidates([]);
  }

  function startEditEvent(item) {
    setEditingEventId(item.id);
    setEventForm({
      title: item.title || "",
      description: item.description || "",
      categoryId: item.category_id || "",
      districtId: item.district_id || "",
      address: item.address || "",
      latitude: item.latitude != null ? String(item.latitude) : "",
      longitude: item.longitude != null ? String(item.longitude) : "",
      organizerName: item.organizer_name || "",
      organizerContact: item.organizer_contact || "",
      imageUrl: item.image_url || "",
      startsAt: toDatetimeLocalValue(item.starts_at),
      endsAt: toDatetimeLocalValue(item.ends_at),
      eventType: item.event_type || "COMMUNITY"
    });
    setEventSubmitMessage("");
    setEventSubmitError("");
    navigate(PAGES.FEED);
    showToast("Режим редактирования: измените поля и нажмите «Сохранить»");
  }

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setEventForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      showToast("Фото добавлено", "success");
    } catch (error) {
      showToast(error.message, "error");
      event.target.value = "";
    }
  }

  async function submitEvent(event) {
    event.preventDefault();
    if (!token) return;
    setEventSubmitMessage("");
    setEventSubmitError("");

    if (
      !eventForm.title ||
      !eventForm.address ||
      !eventForm.organizerName ||
      !eventForm.categoryId ||
      !eventForm.districtId ||
      !eventForm.startsAt ||
      !eventForm.endsAt
    ) {
      const message = "Заполните обязательные поля: название, адрес, организатор, категория, район, даты.";
      setEventSubmitError(message);
      showToast(message, "error");
      return;
    }

    if (new Date(eventForm.startsAt) > new Date(eventForm.endsAt)) {
      const message = "Дата окончания должна быть позже даты начала.";
      setEventSubmitError(message);
      showToast(message, "error");
      return;
    }

    try {
      const payload = buildEventPayload();
      if (editingEventId) {
        await updateEvent(token, editingEventId, payload);
        setEventSubmitMessage("Изменения сохранены и отправлены на модерацию.");
        showToast("Мероприятие обновлено", "success");
      } else {
        await createEvent(token, payload);
        setEventSubmitMessage("Мероприятие отправлено на модерацию.");
        showToast("Мероприятие создано", "success");
      }
      resetEventForm();
      await loadEvents(1);
      setMyEvents(await getMyCreatedEvents(token));
    } catch (error) {
      const message = error?.message || "Не удалось сохранить мероприятие.";
      setEventSubmitError(message);
      showToast(message, "error");
    }
  }

  async function applyModeration(eventId, status) {
    if (!token) return;
    try {
      await moderateEvent(token, eventId, {
        status,
        moderationComment: moderationComments[eventId] || (status === "NEEDS_EDIT" ? "Нужно уточнить данные" : "")
      });
      const [queueItems, stats] = await Promise.all([
        getModerationQueue(token, moderationFilter),
        getAdminStats(token)
      ]);
      setQueue(queueItems);
      setAdminStats(stats);
      await loadEvents(eventsPage);
      showToast("Статус модерации обновлён", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
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
    try {
      await upsertReview(token, { eventId, rating: Number(reviewForm.rating), body: reviewForm.body });
      const items = await getReviews(eventId);
      setReviewsByEvent((prev) => ({ ...prev, [eventId]: items }));
      setReviewForm({ rating: 5, body: "" });
      showToast("Отзыв сохранён", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
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
    if (!window.confirm("Удалить мероприятие?")) return;
    try {
      await deleteEvent(token, eventId);
      await loadEvents(eventsPage);
      setMyEvents(await getMyCreatedEvents(token));
      if (editingEventId === eventId) resetEventForm();
      if (page === PAGES.EVENT) navigate(PAGES.FEED);
      showToast("Мероприятие удалено", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  function resetFilters() {
    setFilters({ q: "", categoryId: "", districtId: "", dateFrom: "", dateTo: "" });
  }

  return (
    <div className="min-h-full">
      <Toast toasts={toasts} />
      <AppHeader token={token} authForm={authForm} setAuthForm={setAuthForm} onAuthSubmit={onAuthSubmit} onLogout={logout} />

      <main className="mx-auto max-w-7xl px-4 py-4">
        {(apiOffline || metaError) && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Сервер API недоступен. Запустите бэкенд: <code className="rounded bg-amber-100 px-1">npm run dev:server</code>
          </div>
        )}
        <AppNav token={token} userRole={user?.role} onNavigate={navigate} />

        <section className="mb-3 text-xs text-slate-500">
          <span className="rounded bg-slate-100 px-2 py-1">Главная</span>
          {page !== PAGES.FEED && <span> / </span>}
          {page !== PAGES.FEED && <span className="rounded bg-slate-100 px-2 py-1">{PAGE_TITLES[page] || page}</span>}
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
          <EventDetailSection
            eventDetails={eventDetails}
            token={token}
            favorites={favorites}
            attendingIds={attendingIds}
            user={user}
            myEventIds={myEventIds}
            myEvents={myEvents}
            reviewsByEvent={reviewsByEvent}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onBack={() => navigate(PAGES.FEED)}
            onToggleAttend={toggleAttend}
            onToggleFavorite={toggleFavorite}
            onEdit={startEditEvent}
            onDelete={onDeleteEvent}
            onOpenReviews={openReviews}
            onSubmitReview={submitReview}
          />
        )}

        {page === PAGES.MY_EVENTS && token && (
          <MyEventsSection
            myEvents={myEvents}
            participantsByEvent={participantsByEvent}
            onShowParticipants={showParticipants}
            onEdit={startEditEvent}
            onOpen={openEventPage}
            onDelete={onDeleteEvent}
          />
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
          <ModerationPanel
            stats={adminStats}
            queue={queue}
            moderationFilter={moderationFilter}
            setModerationFilter={setModerationFilter}
            moderationComments={moderationComments}
            setModerationComments={setModerationComments}
            onApplyModeration={applyModeration}
          />
        )}

        {(page === PAGES.FEED || !token) && token && (
          <EventFormSection
            editingEventId={editingEventId}
            eventForm={eventForm}
            setEventForm={setEventForm}
            meta={meta}
            geocodeCandidates={geocodeCandidates}
            eventSubmitError={eventSubmitError}
            eventSubmitMessage={eventSubmitMessage}
            onSubmit={submitEvent}
            onReset={resetEventForm}
            onGeocode={geocodeCurrentAddress}
            onApplyCandidate={applyGeocodeCandidate}
            onImageFileChange={handleImageFileChange}
          />
        )}

        {(page === PAGES.FEED || !token) && (
          <FeedSection
            filters={filters}
            setFilters={setFilters}
            meta={meta}
            events={events}
            loading={loading}
            total={eventsTotal}
            page={eventsPage}
            totalPages={eventsTotalPages}
            onPageChange={setEventsPage}
            onResetFilters={resetFilters}
            favorites={favorites}
            token={token}
            user={user}
            myEventIds={myEventIds}
            attendingIds={attendingIds}
            eventForm={eventForm}
            setEventForm={setEventForm}
            onToggleFavorite={toggleFavorite}
            onToggleAttend={toggleAttend}
            onOpenEvent={openEventPage}
            onDeleteEvent={onDeleteEvent}
          />
        )}
      </main>
    </div>
  );
}
