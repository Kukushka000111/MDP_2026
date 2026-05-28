import { useEffect, useState } from "react";
import { updateMyProfile } from "../api";
import { fieldErrorClass, readImageFileAsDataUrl } from "../utils";
import { validatePersonName } from "../validation/userValidation";

export default function ProfileEditSection({ profile, token, onUpdated, onCancel, showToast }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    avatarUrl: "",
    vkUrl: "",
    telegram: "",
    bio: ""
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      phone: profile.phone || "",
      avatarUrl: profile.avatar_url || "",
      vkUrl: profile.vk_url || "",
      telegram: profile.telegram || "",
      bio: profile.bio || ""
    });
    setErrors({});
  }, [profile]);

  async function handleAvatarFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      showToast("Фото добавлено", "success");
    } catch (error) {
      showToast(error.message, "error");
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    const firstErr = validatePersonName(form.firstName, "Имя");
    if (firstErr) nextErrors.firstName = firstErr;
    const lastErr = validatePersonName(form.lastName, "Фамилия");
    if (lastErr) nextErrors.lastName = lastErr;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateMyProfile(token, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl.trim(),
        vkUrl: form.vkUrl.trim(),
        telegram: form.telegram.trim(),
        bio: form.bio.trim()
      });
      onUpdated(updated);
      showToast("Профиль сохранён", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = (field) =>
    `w-full rounded border px-3 py-2 ${fieldErrorClass(Boolean(errors[field]))}`;

  return (
    <section className="card-surface mx-auto max-w-2xl p-6 sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-black text-[#054752]">Редактирование профиля</h2>
        {onCancel && (
          <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Эти данные подставляются при создании мероприятий (организатор и контакты).
      </p>

      <form onSubmit={handleSubmit} className="grid max-w-2xl grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-slate-600">Имя</label>
          <input className={inputCls("firstName")} value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
          {errors.firstName && <p className="mt-1 text-xs text-rose-600">{errors.firstName}</p>}
        </div>
        <div>
          <label className="mb-1 block text-slate-600">Фамилия</label>
          <input className={inputCls("lastName")} value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
          {errors.lastName && <p className="mt-1 text-xs text-rose-600">{errors.lastName}</p>}
        </div>
        <div>
          <label className="mb-1 block text-slate-600">Телефон</label>
          <input className="w-full rounded border border-slate-300 px-3 py-2" placeholder="+7 ..." value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-slate-600">Telegram</label>
          <input className="w-full rounded border border-slate-300 px-3 py-2" placeholder="@username" value={form.telegram} onChange={(e) => setForm((p) => ({ ...p, telegram: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-slate-600">VK</label>
          <input className="w-full rounded border border-slate-300 px-3 py-2" placeholder="id или ссылка" value={form.vkUrl} onChange={(e) => setForm((p) => ({ ...p, vkUrl: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-slate-600">Фото (URL или файл до 2 МБ)</label>
          <input className="mb-2 w-full rounded border border-slate-300 px-3 py-2" placeholder="https://..." value={form.avatarUrl.startsWith("data:") ? "" : form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} />
          <input type="file" accept="image/*" className="text-xs" onChange={handleAvatarFile} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-slate-600">О себе</label>
          <textarea className="w-full rounded border border-slate-300 px-3 py-2" rows={3} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </section>
  );
}
