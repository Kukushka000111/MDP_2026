const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseApiError(response, fallback) {
  try {
    const data = await response.json();
    if (data?.error) return data.error;
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
  if (filters.districtId) params.set("districtId", filters.districtId);
  if (filters.dateFrom) params.set("dateFrom", new Date(filters.dateFrom).toISOString());
  if (filters.dateTo) params.set("dateTo", new Date(filters.dateTo).toISOString());
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
  const [categoriesRes, districtsRes] = await Promise.all([
    fetch(`${API_BASE}/meta/categories`),
    fetch(`${API_BASE}/meta/districts`)
  ]);
  if (!categoriesRes.ok || !districtsRes.ok) {
    throw new Error("Не удалось загрузить справочники");
  }
  const categoriesData = await categoriesRes.json();
  const districtsData = await districtsRes.json();
  return {
    categories: categoriesData.items || [],
    districts: districtsData.items || []
  };
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

export async function attendEvent(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/attend`, {
    method: "POST",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось записаться"));
}

export async function leaveEvent(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/attend`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось отменить запись"));
}

export async function getParticipants(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/participants`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить участников"));
  const data = await response.json();
  return data.items || [];
}

export async function getMyProfile(token) {
  const response = await fetch(`${API_BASE}/me/profile`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await parseApiError(response, "Не удалось загрузить профиль"));
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

export async function geocodeAddress(query) {
  if (!query) return null;
  const response = await fetch(`${API_BASE}/meta/geocode?q=${encodeURIComponent(query)}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.items || [];
}
