export const MODERATION_LABELS = {
  PENDING: "На модерации",
  NEEDS_EDIT: "Нужны правки",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено"
};

export const MODERATION_MESSAGES = {
  APPROVED: "Мероприятие одобрено и опубликовано в ленте.",
  NEEDS_EDIT: "Модератор запросил правки. Отредактируйте событие и отправьте снова.",
  REJECTED: "Мероприятие отклонено и не будет показано в ленте.",
  PENDING: "Мероприятие ожидает проверки модератором."
};

export function moderationStatusLabel(status) {
  return MODERATION_LABELS[status] || status;
}

export function moderationStatusClass(status) {
  switch (status) {
    case "APPROVED":
      return "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "NEEDS_EDIT":
      return "bg-amber-100 text-amber-800";
    case "REJECTED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function moderationBannerClass(status) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "NEEDS_EDIT":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

export function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const MAX_IMAGE_FILE_BYTES = 2 * 1024 * 1024;

export function readImageFileAsDataUrl(file) {
  if (!file) return Promise.reject(new Error("Файл не выбран"));
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return Promise.reject(new Error("Файл слишком большой. Максимум 2 МБ."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export const EMPTY_EVENT_FORM = {
  title: "",
  description: "",
  categoryId: "",
  address: "",
  addressPublic: false,
  latitude: "",
  longitude: "",
  imageUrl: "",
  startsAt: "",
  endsAt: "",
  eventType: "COMMUNITY",
  maxParticipants: ""
};

export const REGISTRATION_STATUS_LABELS = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено"
};

export function registrationStatusLabel(status) {
  return REGISTRATION_STATUS_LABELS[status] || status;
}

export function registrationStatusClass(status) {
  switch (status) {
    case "APPROVED":
      return "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "rounded-2xl border border-rose-200 bg-rose-50 text-rose-700";
    case "PENDING":
      return "rounded-2xl border border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "rounded-2xl border border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function registrationStatusPillClass(status) {
  switch (status) {
    case "APPROVED":
      return "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "rounded-2xl border border-rose-200 bg-rose-50 text-rose-700";
    case "PENDING":
      return "rounded-2xl border border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "rounded-2xl border border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function moderationBadgePastel(status) {
  switch (status) {
    case "APPROVED":
      return "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "NEEDS_EDIT":
      return "rounded-2xl border border-orange-200 bg-orange-50 text-orange-700";
    case "REJECTED":
      return "rounded-2xl border border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "rounded-2xl border border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function attendButtonLabel(status, spots) {
  if (status === "APPROVED") return "Отменить запись";
  if (status === "PENDING") return "Отменить заявку";
  if (spots.isFull) return "Мест нет";
  return "Подать заявку";
}

export function canViewOrganizerContacts({ registrationStatus, isOrganizer, isAdmin }) {
  if (isOrganizer || isAdmin) return true;
  return registrationStatus === "APPROVED";
}

export function isAddressPublic(event) {
  return event?.address_public === true || event?.address_public === "t";
}

export function canViewEventLocation({ event, registrationStatus, isOrganizer, isAdmin }) {
  if (!event) return false;
  if (isOrganizer || isAdmin) return true;
  if (isAddressPublic(event)) return true;
  return registrationStatus === "APPROVED";
}

export function eventLocationLabel(event, canView) {
  if (canView) return event?.address || "—";
  return "Адрес откроется после одобрения заявки";
}

export function isEventOrganizer(event, userId) {
  if (!event || !userId) return false;
  return event.created_by === userId;
}

export function spotsBadgeText(event) {
  const spots = eventSpotsInfo(event);
  if (!spots.hasLimit) return null;
  if (spots.isFull) return "Мест нет";
  return `Осталось ${spots.remaining} ${spots.remaining === 1 ? "место" : spots.remaining < 5 ? "места" : "мест"}!`;
}

export function platformTenureLabel(memberSince) {
  if (!memberSince) return "Новый организатор";
  const start = new Date(memberSince);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 1) return "На платформе меньше месяца";
  if (months < 12) return `На платформе ${months} мес.`;
  const years = Math.floor(months / 12);
  return `На платформе ${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`;
}

export function organizerEventsLabel(count) {
  const n = Number(count) || 0;
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = "мероприятий";
  if (mod10 === 1 && mod100 !== 11) word = "мероприятие";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "мероприятия";
  return `Организовал ${n} ${word}`;
}

export function eventSpotsInfo(event) {
  const registered = Number(event.registrations_count) || 0;
  const max = event.max_participants != null ? Number(event.max_participants) : null;

  if (max == null) {
    return {
      hasLimit: false,
      registered,
      remaining: null,
      isFull: false,
      label: `Записались: ${registered}`
    };
  }

  const remaining = Math.max(0, max - registered);
  return {
    hasLimit: true,
    registered,
    max,
    remaining,
    isFull: remaining <= 0,
    label: remaining > 0 ? `Осталось мест: ${remaining} из ${max}` : "Мест нет"
  };
}

export function isPreciseAddress(address) {
  const normalized = address.trim();
  const hasComma = normalized.includes(",");
  const hasHouseNumber = /\d/.test(normalized);
  return hasComma && hasHouseNumber;
}

export function fieldErrorClass(hasError) {
  return hasError ? "border-rose-500 ring-1 ring-rose-300" : "border-slate-300";
}

export function validateEventForm(form) {
  const errors = {};

  if (!form.title?.trim()) errors.title = "Укажите название";
  if (!form.categoryId) errors.categoryId = "Выберите категорию";
  if (!form.startsAt) errors.startsAt = "Укажите дату начала";
  if (!form.endsAt) errors.endsAt = "Укажите дату окончания";

  if (form.address?.trim()) {
    if (!isPreciseAddress(form.address)) {
      errors.address = "Формат: город, улица, дом (например: Омск, Ленина, 10)";
    }
  } else {
    errors.address = "Укажите адрес";
  }

  if (form.startsAt && form.endsAt && new Date(form.startsAt) > new Date(form.endsAt)) {
    errors.endsAt = "Дата окончания должна быть позже даты начала";
  }

  if (form.maxParticipants !== "" && form.maxParticipants != null) {
    const limit = Number(form.maxParticipants);
    if (!Number.isInteger(limit) || limit < 1) {
      errors.maxParticipants = "Лимит мест — целое число от 1";
    }
  }

  const hasMarker =
    Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));
  if (!hasMarker) {
    errors.mapMarker = "Укажите точку на карте — кликните по карте справа";
  }

  return errors;
}

function normalizeTelegram(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://t.me/${handle}`;
}

function normalizeVk(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("vk.com/")) return `https://${trimmed}`;
  return `https://vk.com/${trimmed.replace(/^@/, "")}`;
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return `tel:+${digits.startsWith("7") ? digits : `7${digits}`}`;
}

export function buildContactLinks(event) {
  const links = [];
  if (event.organizer_phone) {
    const href = normalizePhone(event.organizer_phone);
    if (href) links.push({ label: event.organizer_phone, href, kind: "phone" });
  }
  if (event.organizer_telegram) {
    const href = normalizeTelegram(event.organizer_telegram);
    if (href) links.push({ label: event.organizer_telegram, href, kind: "telegram" });
  }
  if (event.organizer_vk) {
    const href = normalizeVk(event.organizer_vk);
    if (href) links.push({ label: event.organizer_vk, href, kind: "vk" });
  }
  if (links.length === 0 && event.organizer_contact) {
    links.push({ label: event.organizer_contact, href: null, kind: "text" });
  }
  return links;
}
