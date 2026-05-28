export const MODERATION_LABELS = {
  PENDING: "На модерации",
  NEEDS_EDIT: "Нужны правки",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено"
};

export function moderationStatusLabel(status) {
  return MODERATION_LABELS[status] || status;
}

export function moderationStatusClass(status) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800";
    case "NEEDS_EDIT":
      return "bg-amber-100 text-amber-800";
    case "REJECTED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
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
};
