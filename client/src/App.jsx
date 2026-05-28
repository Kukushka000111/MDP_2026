import { useCallback, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  addServerFavorite,
  attendEvent,
  checkApiHealth,
  createEvent,
  deleteEvent,
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
  getUserProfile,
  getReviews,
  reportEvent,
  getFavoriteEvents,
  getServerFavorites,
  leaveEvent,
  moderateEvent,
  removeServerFavorite,
  removeEventParticipant,
  reviewEventRegistration,
  updateEvent,
  upsertReview
} from "./api";
import AppFooter from "./components/AppFooter";
import AppHeader from "./components/AppHeader";
import ReportEventModal from "./components/ReportEventModal";
import AttendApplyModal from "./components/AttendApplyModal";
import EventDetailSection from "./components/EventDetailSection";
import EventFormSection from "./components/EventFormSection";
import FeedSection from "./components/FeedSection";
import FavoritesSection from "./components/FavoritesSection";
import ModerationPanel from "./components/ModerationPanel";
import MyActivitySection from "./components/MyActivitySection";
import LoginPage from "./components/LoginPage";
import ProfileEditSection from "./components/ProfileEditSection";
import UserProfileView from "./components/UserProfileView";
import RegisterPage from "./components/RegisterPage";
import Toast from "./Toast";
import { FAVORITES_KEY, PAGE_SIZE, PAGE_TITLES, PAGES, TOKEN_KEY } from "./constants";
import {
  EMPTY_EVENT_FORM,
  readImageFileAsDataUrl,
  toDatetimeLocalValue,
  validateEventForm
} from "./utils";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function parseHashRoute() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return { page: PAGES.FEED, eventId: "", userId: "" };
  if (raw.startsWith("event/")) {
    return { page: PAGES.EVENT, eventId: raw.slice(6), userId: "" };
  }
  if (raw.startsWith("user/")) {
    return { page: PAGES.USER, eventId: "", userId: raw.slice(5) };
  }
  if (Object.values(PAGES).includes(raw)) {
    return { page: raw, eventId: "", userId: "" };
  }
  return { page: PAGES.FEED, eventId: "", userId: "" };
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
  const [routeUserId, setRouteUserId] = useState(initialRoute.userId);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [meta, setMeta] = useState({ categories: [] });
  const [favorites, setFavorites] = useState(parseLocalFavorites);
  const [favoriteEventsList, setFavoriteEventsList] = useState([]);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [myAttending, setMyAttending] = useState([]);
  const [participantsByEvent, setParticipantsByEvent] = useState({});
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
  const [attendModal, setAttendModal] = useState({ open: false, eventId: "", title: "" });
  const [reportModal, setReportModal] = useState({ open: false, eventId: "", title: "" });
  const [eventSubmitMessage, setEventSubmitMessage] = useState("");
  const [eventSubmitError, setEventSubmitError] = useState("");
  const [eventFieldErrors, setEventFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    categoryId: "",
    eventType: "",
    dateFrom: "",
    dateTo: ""
  });

  function applyRoute(route) {
    setPage(route.page);
    setRouteEventId(route.eventId);
    setRouteUserId(route.userId);
  }

  function navigate(nextPage, eventId = "", userId = "") {
    if (nextPage === PAGES.EVENT && eventId) {
      applyRoute({ page: PAGES.EVENT, eventId, userId: "" });
      const target = `event/${eventId}`;
      if (window.location.hash.replace(/^#/, "") !== target) {
        window.location.hash = target;
      }
      return;
    }
    if (nextPage === PAGES.USER && userId) {
      applyRoute({ page: PAGES.USER, eventId: "", userId });
      const target = `user/${userId}`;
      if (window.location.hash.replace(/^#/, "") !== target) {
        window.location.hash = target;
      }
      return;
    }
    applyRoute({ page: nextPage, eventId: "", userId: "" });
    if (window.location.hash.replace(/^#/, "") !== nextPage) {
      window.location.hash = nextPage;
    }
  }

  function openUserProfile(userId) {
    if (!userId) return;
    navigate(PAGES.USER, "", userId);
  }

  useEffect(() => {
    function onHashChange() {
      applyRoute(parseHashRoute());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        if (page === PAGES.PROFILE) {
          const profile = await getMyProfile(token);
          if (!cancelled) setMyProfile(profile);
        }
        if (page === PAGES.ATTENDING || page === PAGES.MY_EVENTS) {
          const [attending, created] = await Promise.all([
            getMyAttendingEvents(token),
            getMyCreatedEvents(token)
          ]);
          if (!cancelled) {
            setMyAttending(attending);
            setMyEvents(created);
          }
        }
        if (page === PAGES.FAVORITES) {
          const items = await getFavoriteEvents(token);
          if (!cancelled) setFavoriteEventsList(items);
        }
      } catch (error) {
        if (!cancelled) showToast(error.message, "error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, token]);

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
    if (!token && [PAGES.PROFILE, PAGES.MY_EVENTS, PAGES.ATTENDING, PAGES.MODERATION].includes(page)) {
      navigate(PAGES.LOGIN);
    }
    if (token && (page === PAGES.LOGIN || page === PAGES.REGISTER)) {
      navigate(PAGES.FEED);
    }
  }, [token, page]);

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
  }, [filters.categoryId, filters.eventType, filters.dateFrom, filters.dateTo, debouncedQ]);

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

  const registrationStatusMap = useMemo(() => {
    const map = new Map();
    myAttending.forEach((item) => {
      map.set(item.id, item.registration_status);
    });
    return map;
  }, [myAttending]);

  useEffect(() => {
    if (page !== PAGES.FAVORITES || token) return;
    setFavoriteEventsList(events.filter((event) => favorites.includes(event.id)));
  }, [page, token, favorites, events]);

  const myEventIds = useMemo(() => new Set(myEvents.map((item) => item.id)), [myEvents]);

  const organizerPreview = useMemo(() => {
    if (!myProfile) return null;
    const name = `${myProfile.first_name || ""} ${myProfile.last_name || ""}`.trim()
      || myProfile.display_name;
    return {
      name,
      phone: myProfile.phone,
      telegram: myProfile.telegram,
      vkUrl: myProfile.vk_url
    };
  }, [myProfile]);

  useEffect(() => {
    if (page !== PAGES.USER || !routeUserId) {
      setViewedProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const item = await getUserProfile(routeUserId, token);
        if (!cancelled) setViewedProfile(item);
      } catch (error) {
        if (!cancelled) {
          setViewedProfile(null);
          showToast(error.message, "error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, routeUserId, token]);

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
      if (page === PAGES.FAVORITES) {
        setFavoriteEventsList(await getFavoriteEvents(token));
      }
      showToast(isActive ? "Убрано из избранного" : "Добавлено в избранное", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function refreshAttendState(eventId) {
    setMyAttending(await getMyAttendingEvents(token));
    await loadEvents(eventsPage);
    if (page === PAGES.EVENT && routeEventId === eventId) {
      setEventDetails(await getEventDetails(eventId, token));
    }
  }

  function handleAttendAction(eventId, currentStatus) {
    if (!token) return;
    const event =
      events.find((item) => item.id === eventId) || (eventDetails?.id === eventId ? eventDetails : null);
    if (event && (event.created_by === user?.id || myEventIds.has(eventId))) {
      showToast("Организатор не может записаться на своё мероприятие", "error");
      return;
    }
    if (currentStatus === "APPROVED" || currentStatus === "PENDING") {
      cancelAttend(eventId, currentStatus);
      return;
    }
    const eventTitle =
      events.find((item) => item.id === eventId)?.title || eventDetails?.title || "";
    setAttendModal({ open: true, eventId, title: eventTitle });
  }

  async function cancelAttend(eventId, currentStatus) {
    if (!token) return;
    try {
      await leaveEvent(token, eventId);
      await refreshAttendState(eventId);
      showToast(
        currentStatus === "PENDING" ? "Заявка отменена" : "Запись отменена",
        "success"
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function submitAttendApplication(message) {
    if (!token || !attendModal.eventId) return;
    try {
      await attendEvent(token, attendModal.eventId, message);
      await refreshAttendState(attendModal.eventId);
      showToast("Заявка отправлена организатору", "success");
    } catch (error) {
      showToast(error.message, "error");
      throw error;
    }
  }

  async function handleReviewRegistration(eventId, userId, status) {
    if (!token) return;
    try {
      await reviewEventRegistration(token, eventId, userId, status);
      const items = await getParticipants(token, eventId);
      setParticipantsByEvent((prev) => ({ ...prev, [eventId]: items }));
      setMyEvents(await getMyCreatedEvents(token));
      await loadEvents(eventsPage);
      showToast(status === "APPROVED" ? "Заявка одобрена" : "Заявка отклонена", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function handleKickParticipant(eventId, userId, displayName) {
    if (!token) return;
    const label = displayName || "участника";
    if (!window.confirm(`Исключить ${label} с мероприятия?`)) return;
    try {
      await removeEventParticipant(token, eventId, userId);
      const items = await getParticipants(token, eventId);
      setParticipantsByEvent((prev) => ({ ...prev, [eventId]: items }));
      setMyEvents(await getMyCreatedEvents(token));
      await loadEvents(eventsPage);
      showToast("Участник исключён", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  function handleProfileUpdated(item) {
    setMyProfile(item);
    if (viewedProfile?.id === item.id) {
      setViewedProfile(item);
    }
    setUser((prev) =>
      prev
        ? {
          ...prev,
          display_name: item.display_name,
          first_name: item.first_name,
          last_name: item.last_name
        }
        : prev
    );
    if (page === PAGES.PROFILE_EDIT) {
      navigate(PAGES.PROFILE);
    }
  }

  async function handleAuthSuccess(result) {
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem(TOKEN_KEY, result.token);
    const profile = await getMyProfile(result.token);
    setMyProfile(profile);
    const [created, attending] = await Promise.all([
      getMyCreatedEvents(result.token),
      getMyAttendingEvents(result.token)
    ]);
    setMyEvents(created);
    setMyAttending(attending);
    navigate(PAGES.FEED);
    showToast("Добро пожаловать!", "success");
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
    const maxParticipants =
      eventForm.maxParticipants === "" || eventForm.maxParticipants == null
        ? null
        : Number(eventForm.maxParticipants);

    return {
      title: eventForm.title,
      description: eventForm.description || "",
      categoryId: eventForm.categoryId,
      address: eventForm.address,
      addressPublic: Boolean(eventForm.addressPublic),
      latitude: eventForm.latitude ? Number(eventForm.latitude) : null,
      longitude: eventForm.longitude ? Number(eventForm.longitude) : null,
      imageUrl: eventForm.imageUrl || "",
      startsAt: new Date(eventForm.startsAt).toISOString(),
      endsAt: new Date(eventForm.endsAt).toISOString(),
      maxParticipants,
      eventType: eventForm.eventType
    };
  }

  function resetEventForm() {
    setEventForm(EMPTY_EVENT_FORM);
    setEditingEventId("");
    setEventFieldErrors({});
  }

  function startEditEvent(item) {
    setEditingEventId(item.id);
    setEventForm({
      title: item.title || "",
      description: item.description || "",
      categoryId: item.category_id || "",
      address: item.address || "",
      addressPublic: item.address_public === true || item.address_public === "t",
      latitude: item.latitude != null ? String(item.latitude) : "",
      longitude: item.longitude != null ? String(item.longitude) : "",
      imageUrl: item.image_url || "",
      startsAt: toDatetimeLocalValue(item.starts_at),
      endsAt: toDatetimeLocalValue(item.ends_at),
      eventType: item.event_type || "COMMUNITY",
      maxParticipants: item.max_participants != null ? String(item.max_participants) : ""
    });
    setEventSubmitMessage("");
    setEventSubmitError("");
    navigate(PAGES.CREATE_EVENT);
    showToast("Измените поля и нажмите «Сохранить»");
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
    const fieldErrors = validateEventForm(eventForm);
    setEventFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      const message = Object.values(fieldErrors)[0];
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
      setEventFieldErrors({});
      await loadEvents(1);
      setMyEvents(await getMyCreatedEvents(token));
      navigate(PAGES.MY_EVENTS);
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

  function openReportModal(eventId, title = "") {
    if (!token) return;
    setReportModal({ open: true, eventId, title });
  }

  async function submitReport(reason) {
    if (!token || !reportModal.eventId) return;
    await reportEvent(token, reportModal.eventId, reason);
    showToast("Жалоба отправлена модераторам", "success");
  }

  function resetFilters() {
    setFilters({
      q: "",
      categoryId: "",
      eventType: "",
      dateFrom: "",
      dateTo: ""
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <Toast toasts={toasts} />
      <AttendApplyModal
        open={attendModal.open}
        eventTitle={attendModal.title}
        onClose={() => setAttendModal({ open: false, eventId: "", title: "" })}
        onSubmit={submitAttendApplication}
      />
      <ReportEventModal
        open={reportModal.open}
        eventTitle={reportModal.title}
        onClose={() => setReportModal({ open: false, eventId: "", title: "" })}
        onSubmit={submitReport}
      />
      <AppHeader
        token={token}
        userRole={user?.role}
        page={page}
        profileAvatarUrl={myProfile?.avatar_url}
        profileInitial={
          myProfile
            ? `${myProfile.first_name || ""} ${myProfile.last_name || ""}`.trim() || myProfile.display_name
            : user?.display_name || user?.login
        }
        onNavigate={navigate}
        showToast={showToast}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {(apiOffline || metaError) && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Сервер API недоступен. Запустите бэкенд: <code className="rounded bg-amber-100 px-1">npm run dev:server</code>
          </div>
        )}
        {page !== PAGES.FEED && (
          <section className="mb-4 text-sm font-medium text-slate-500">
            <button type="button" className="text-indigo-600 hover:underline" onClick={() => navigate(PAGES.FEED)}>
              Главная
            </button>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-900">{PAGE_TITLES[page] || page}</span>
          </section>
        )}

        {page === PAGES.REGISTER && !token && (
          <RegisterPage onSuccess={handleAuthSuccess} onNavigate={navigate} showToast={showToast} />
        )}

        {page === PAGES.LOGIN && !token && (
          <LoginPage onSuccess={handleAuthSuccess} onNavigate={navigate} showToast={showToast} />
        )}

        {page === PAGES.PROFILE && token && (
          myProfile ? (
            <UserProfileView
              profile={myProfile}
              isOwn
              onEdit={() => navigate(PAGES.PROFILE_EDIT)}
              onLogout={logout}
            />
          ) : (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow">Загрузка профиля…</p>
          )
        )}

        {page === PAGES.PROFILE_EDIT && token && myProfile && (
          <ProfileEditSection
            profile={myProfile}
            token={token}
            onUpdated={handleProfileUpdated}
            onCancel={() => navigate(PAGES.PROFILE)}
            showToast={showToast}
          />
        )}

        {page === PAGES.USER && (
          <UserProfileView
            profile={viewedProfile}
            isOwn={viewedProfile?.id === user?.id}
            onEdit={viewedProfile?.id === user?.id ? () => navigate(PAGES.PROFILE_EDIT) : undefined}
            onBack={() => navigate(PAGES.FEED)}
          />
        )}

        {page === PAGES.EVENT && eventDetails && (
          <EventDetailSection
            eventDetails={eventDetails}
            token={token}
            favorites={favorites}
            registrationStatus={
              registrationStatusMap.get(eventDetails.id) || eventDetails.my_registration_status
            }
            user={user}
            myEventIds={myEventIds}
            myEvents={myEvents}
            reviewsByEvent={reviewsByEvent}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onBack={() => navigate(PAGES.FEED)}
            onAttendAction={handleAttendAction}
            onToggleFavorite={toggleFavorite}
            onEdit={startEditEvent}
            onDelete={onDeleteEvent}
            onOpenReviews={openReviews}
            onSubmitReview={submitReview}
            onReport={openReportModal}
            onOpenUser={openUserProfile}
          />
        )}

        {(page === PAGES.MY_EVENTS || page === PAGES.ATTENDING) && token && (
          <MyActivitySection
            activeTab={page === PAGES.ATTENDING ? "attending" : "organizing"}
            onTabChange={(tab) => navigate(tab === "attending" ? PAGES.ATTENDING : PAGES.MY_EVENTS)}
            myEvents={myEvents}
            myAttending={myAttending}
            participantsByEvent={participantsByEvent}
            onShowParticipants={showParticipants}
            onReviewRegistration={handleReviewRegistration}
            onKickParticipant={handleKickParticipant}
            onEdit={startEditEvent}
            onOpen={openEventPage}
            onDelete={onDeleteEvent}
            onOpenUser={openUserProfile}
          />
        )}

        {page === PAGES.FAVORITES && (
          <FavoritesSection
            events={favoriteEventsList}
            favorites={favorites}
            registrationStatusMap={registrationStatusMap}
            token={token}
            user={user}
            myEventIds={myEventIds}
            onOpen={openEventPage}
            onToggleFavorite={toggleFavorite}
            onAttendAction={handleAttendAction}
            onDeleteEvent={onDeleteEvent}
            onReport={openReportModal}
            onOpenUser={openUserProfile}
          />
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

        {page === PAGES.CREATE_EVENT && token && (
          <EventFormSection
            editingEventId={editingEventId}
            eventForm={eventForm}
            setEventForm={setEventForm}
            meta={meta}
            fieldErrors={eventFieldErrors}
            eventSubmitError={eventSubmitError}
            eventSubmitMessage={eventSubmitMessage}
            organizerPreview={organizerPreview}
            userRole={user?.role}
            onEditProfile={() => navigate(PAGES.PROFILE)}
            onBack={() => navigate(PAGES.FEED)}
            onSubmit={submitEvent}
            onReset={resetEventForm}
            onImageFileChange={handleImageFileChange}
          />
        )}

        {page === PAGES.CREATE_EVENT && !token && (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-600 shadow">
            Войдите в аккаунт, чтобы создавать мероприятия.{" "}
            <button type="button" className="text-indigo-600 underline" onClick={() => navigate(PAGES.LOGIN)}>
              Войти
            </button>
          </p>
        )}

        {page === PAGES.FEED && (
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
            registrationStatusMap={registrationStatusMap}
            onToggleFavorite={toggleFavorite}
            onAttendAction={handleAttendAction}
            onOpenEvent={openEventPage}
            onDeleteEvent={onDeleteEvent}
            onReportEvent={openReportModal}
            onOpenUser={openUserProfile}
          />
        )}
      </main>

      <AppFooter token={token} onNavigate={navigate} />
    </div>
  );
}
