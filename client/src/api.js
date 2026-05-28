const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_ERROR_RU = {
  "Email is already registered": "Этот email уже занят",
  "Invalid credentials": "Неверный логин или пароль",
  "Неверный логин или пароль": "Неверный логин или пароль",
  "Этот логин уже занят": "Этот логин уже занят",
  "startsAt must be earlier than endsAt": "Дата окончания должна быть позже даты начала",
  "Свободных мест нет": "Свободных мест нет",
  "Вы уже подали заявку на это мероприятие": "Вы уже подали заявку на это мероприятие",
  "Организатор не может записаться на своё мероприятие":
    "Организатор не может записаться на своё мероприятие",
  "Отзыв могут оставить только записавшиеся на мероприятие":
    "Отзыв могут оставить только записавшиеся на мероприятие"
};

async function parseApiError(response, fallback) {
  try {
    const data = await response.json();
    if (data?.error) return API_ERROR_RU[data.error] || data.error;
  } catch (_error) {
    // keep fallback
  }
  return fallback;
}

export async function checkApiHealth() {
  const base = API_BASE.replace(/\/api$/, "");
  const response = await fetch(`${base}/health`);
  return response.ok;
}

export async function getEvents(filters, pagination = { page: 1, limit: 10 }) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.dateFrom) params.set("dateFrom", new Date(filters.dateFrom).toISOString());
  if (filters.dateTo) params.set("dateTo", new Date(filters.dateTo).toISOString());
  if (filters.eventType) params.set("type", filters.eventType);
  params.set("page", String(pagination.page));
  params.set("limit", String(pagination.limit));

  const response = await fetch(`${API_BASE}/events?${params.toString()}`);
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить события"));
  const data = await response.json();
  return {
    items: data.items || [],
    total: data.total ?? 0,
    page: data.page ?? pagination.page,
    limit: data.limit ?? pagination.limit,
    totalPages: data.totalPages ?? 1
  };
}

export async function getAdminStats(token) {
  const response = await fetch(`${API_BASE}/admin/stats`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить статистику"));
  return response.json();
}

export async function getEventDetails(eventId, token = "") {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить мероприятие"));
  const data = await response.json();
  return data.item;
}

export async function getMeta() {
  const categoriesRes = await fetch(`${API_BASE}/meta/categories`);
  if (!categoriesRes.ok) {
    throw new Error("Не удалось загрузить справочники");
  }
  const categoriesData = await categoriesRes.json();
  return {
    categories: categoriesData.items || []
  };
}

export async function getCaptcha() {
  const response = await fetch(`${API_BASE}/auth/captcha`);
  if (!response.ok) throw new Error("Не удалось загрузить капчу");
  return response.json();
}

export async function reportEvent(token, eventId, reason = "") {
  const response = await fetch(`${API_BASE}/events/${eventId}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось отправить жалобу"));
  return response.json();
}

export async function getNotifications(token) {
  const response = await fetch(`${API_BASE}/notifications`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить уведомления"));
  return response.json();
}

export async function markAllNotificationsRead(token) {
  const response = await fetch(`${API_BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Ошибка"));
}

export async function markNotificationRead(token, notificationId) {
  const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Ошибка"));
}

export async function checkAuthAvailability(field, value) {
  if (!value?.trim()) return { available: true, field };
  const params = new URLSearchParams({ field, value: value.trim() });
  const response = await fetch(`${API_BASE}/auth/check-availability?${params.toString()}`);
  if (!response.ok) return { available: true, field };
  return response.json();
}

export async function register(payload) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Ошибка регистрации"));
  return response.json();
}

export async function login(payload) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Ошибка входа"));
  return response.json();
}

export async function getServerFavorites(token) {
  const response = await fetch(`${API_BASE}/favorites`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить избранное"));
  const data = await response.json();
  return (data.items || []).map((item) => item.id);
}

export async function getFavoriteEvents(token) {
  const response = await fetch(`${API_BASE}/favorites`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить избранное"));
  const data = await response.json();
  return data.items || [];
}

export async function addServerFavorite(token, eventId) {
  const response = await fetch(`${API_BASE}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify({ eventId })
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось добавить в избранное"));
}

export async function removeServerFavorite(token, eventId) {
  const response = await fetch(`${API_BASE}/favorites/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось убрать из избранного"));
}

export async function getMe(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить профиль"));
  return response.json();
}

export async function createEvent(token, payload) {
  const response = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось создать мероприятие"));
  return response.json();
}

export async function updateEvent(token, eventId, payload) {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось обновить мероприятие"));
  return response.json();
}

export async function deleteEvent(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось удалить мероприятие"));
}

export async function getModerationQueue(token, status = "") {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const response = await fetch(
    `${API_BASE}/admin/events/moderation-queue?${params.toString()}`,
    {
      headers: authHeaders(token)
    }
  );
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить очередь модерации"));
  const data = await response.json();
  return data.items || [];
}

export async function moderateEvent(token, eventId, payload) {
  const response = await fetch(`${API_BASE}/admin/events/${eventId}/moderation`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось обновить модерацию"));
  return response.json();
}

export async function getReviews(eventId) {
  const response = await fetch(`${API_BASE}/reviews/event/${eventId}`);
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить отзывы"));
  const data = await response.json();
  return data.items || [];
}

export async function upsertReview(token, payload) {
  const response = await fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось сохранить отзыв"));
  return response.json();
}

export async function attendEvent(token, eventId, message = "") {
  const response = await fetch(`${API_BASE}/events/${eventId}/attend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify({ message })
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось отправить заявку"));
}

export async function leaveEvent(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/attend`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось отменить запись"));
}

export async function getUserProfile(userId, token = "") {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить профиль"));
  const data = await response.json();
  return data.item;
}

export async function getEventAttendees(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/attendees`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить участников"));
  const data = await response.json();
  return data.items || [];
}

export async function getParticipants(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/participants`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить участников"));
  const data = await response.json();
  return data.items || [];
}

export async function removeEventParticipant(token, eventId, userId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/registrations/${userId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось исключить участника"));
}

export async function reviewEventRegistration(token, eventId, userId, status) {
  const response = await fetch(`${API_BASE}/events/${eventId}/registrations/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось обновить заявку"));
  return response.json();
}

export async function getMyProfile(token) {
  const response = await fetch(`${API_BASE}/me/profile`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить профиль"));
  const data = await response.json();
  return data.item;
}

export async function updateMyProfile(token, payload) {
  const response = await fetch(`${API_BASE}/me/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось сохранить профиль"));
  const data = await response.json();
  return data.item;
}

export async function getMyCreatedEvents(token) {
  const response = await fetch(`${API_BASE}/me/created-events`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить мои мероприятия"));
  const data = await response.json();
  return data.items || [];
}

export async function getMyAttendingEvents(token) {
  const response = await fetch(`${API_BASE}/me/attending-events`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить записи"));
  const data = await response.json();
  return data.items || [];
}

