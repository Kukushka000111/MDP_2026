const API_BASE = "http://localhost:4000/api";

const demoEvents = [
  {
    id: "demo-1",
    title: "Лекция в библиотеке",
    description: "Открытая лекция по истории города",
    category_id: "demo-cat-lectures",
    district_id: "demo-district-central",
    category_name: "Лекции",
    district_name: "Центральный",
    starts_at: "2026-05-09T16:00:00.000Z",
    ends_at: "2026-05-09T18:00:00.000Z",
    latitude: 54.9885,
    longitude: 73.3242,
    event_type: "OFFICIAL"
  },
  {
    id: "demo-2",
    title: "Дворовый кинопоказ",
    description: "Кино под открытым небом от жителей района",
    category_id: "demo-cat-cinema",
    district_id: "demo-district-south",
    category_name: "Кино",
    district_name: "Южный",
    starts_at: "2026-05-10T18:30:00.000Z",
    ends_at: "2026-05-10T21:00:00.000Z",
    latitude: 54.965,
    longitude: 73.38,
    event_type: "COMMUNITY"
  }
];

export async function getEvents(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.districtId) params.set("districtId", filters.districtId);
  if (filters.dateFrom) params.set("dateFrom", new Date(filters.dateFrom).toISOString());
  if (filters.dateTo) params.set("dateTo", new Date(filters.dateTo).toISOString());

  try {
    const response = await fetch(`${API_BASE}/events?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to load events");
    const data = await response.json();
    return data.items || [];
  } catch (_error) {
    return demoEvents;
  }
}

export async function getEventDetails(eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}`);
  if (!response.ok) throw new Error("Event details load failed");
  const data = await response.json();
  return data.item;
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMeta() {
  try {
    const [categoriesRes, districtsRes] = await Promise.all([
      fetch(`${API_BASE}/meta/categories`),
      fetch(`${API_BASE}/meta/districts`)
    ]);
    if (!categoriesRes.ok || !districtsRes.ok) {
      throw new Error("Failed to load metadata");
    }
    const categoriesData = await categoriesRes.json();
    const districtsData = await districtsRes.json();
    return {
      categories: categoriesData.items || [],
      districts: districtsData.items || []
    };
  } catch (_error) {
    return {
      categories: [
        { id: "demo-cat-lectures", name: "Лекции" },
        { id: "demo-cat-cinema", name: "Кино" }
      ],
      districts: [
        { id: "demo-district-central", name: "Центральный" },
        { id: "demo-district-south", name: "Южный" }
      ]
    };
  }
}

export async function register(payload) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Registration failed");
  return response.json();
}

export async function login(payload) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

export async function getServerFavorites(token) {
  const response = await fetch(`${API_BASE}/favorites`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error("Favorites load failed");
  const data = await response.json();
  return (data.items || []).map((item) => item.id);
}

export async function addServerFavorite(token, eventId) {
  await fetch(`${API_BASE}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify({ eventId })
  });
}

export async function removeServerFavorite(token, eventId) {
  await fetch(`${API_BASE}/favorites/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
}

export async function getMe(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error("Profile load failed");
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
  if (!response.ok) {
    let message = "Event creation failed";
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch (_error) {
      // keep fallback message
    }
    throw new Error(message);
  }
  return response.json();
}

export async function deleteEvent(token, eventId) {
  await fetch(`${API_BASE}/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
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
  if (!response.ok) throw new Error("Moderation queue load failed");
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
  if (!response.ok) throw new Error("Moderation update failed");
  return response.json();
}

export async function getReviews(eventId) {
  const response = await fetch(`${API_BASE}/reviews/event/${eventId}`);
  if (!response.ok) throw new Error("Reviews load failed");
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
  if (!response.ok) throw new Error("Review submit failed");
  return response.json();
}

export async function attendEvent(token, eventId) {
  await fetch(`${API_BASE}/events/${eventId}/attend`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export async function leaveEvent(token, eventId) {
  await fetch(`${API_BASE}/events/${eventId}/attend`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
}

export async function getParticipants(token, eventId) {
  const response = await fetch(`${API_BASE}/events/${eventId}/participants`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error("Participants load failed");
  const data = await response.json();
  return data.items || [];
}

export async function getMyProfile(token) {
  const response = await fetch(`${API_BASE}/me/profile`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error("Profile load failed");
  const data = await response.json();
  return data.item;
}

export async function getMyCreatedEvents(token) {
  const response = await fetch(`${API_BASE}/me/created-events`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error("My events load failed");
  const data = await response.json();
  return data.items || [];
}

export async function getMyAttendingEvents(token) {
  const response = await fetch(`${API_BASE}/me/attending-events`, {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error("Attending events load failed");
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
