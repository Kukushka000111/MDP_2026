import OrganizerContacts from "./OrganizerContacts";
import ThemeToggle from "./ThemeToggle";
import { organizerEventsLabel, platformTenureLabel } from "../utils";

const GENDER_LABELS = { MALE: "Мужской", FEMALE: "Женский" };

function ProfileRow({ label, children }) {
  return (
    <div className="border-b border-slate-100 py-4 dark:border-slate-700">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{children}</div>
    </div>
  );
}

export default function UserProfileView({
  profile,
  isOwn,
  onEdit,
  onLogout,
  onBack,
  theme,
  onThemeChange
}) {
  if (!profile) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Загрузка профиля…</p>;
  }

  const name =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.display_name;

  const verified =
    profile.organizer_verified === true
    || (
      Boolean(profile.phone?.trim())
      && (Boolean(profile.telegram?.trim()) || Boolean(profile.vk_url?.trim()))
    );

  const contactEvent = {
    organizer_phone: profile.phone,
    organizer_telegram: profile.telegram,
    organizer_vk: profile.vk_url
  };

  return (
    <section className="mx-auto max-w-2xl">
      {onBack && (
        <button type="button" className="btn-ghost mb-4" onClick={onBack}>
          ← Назад
        </button>
      )}

      <h2 className="section-heading mb-6 text-3xl">
        {isOwn ? "Мой профиль" : name}
      </h2>

      <div className="card-surface p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-5 border-b border-slate-100 pb-6 dark:border-slate-700">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-100" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-3xl font-black text-slate-900 dark:bg-indigo-950 dark:text-indigo-200">
              {(name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{name}</p>
              {verified && (
                <span className="status-positive inline-flex h-6 w-6 items-center justify-center text-xs font-bold">
                  ✓
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500">@{profile.login}</p>
            <p className="mt-1 text-sm text-indigo-600">{organizerEventsLabel(profile.events_organized_count)}</p>
            <p className="text-sm text-slate-500">{platformTenureLabel(profile.created_at)}</p>
          </div>
        </div>

        {profile.email && <ProfileRow label="Email">{profile.email}</ProfileRow>}
        {profile.gender && (
          <ProfileRow label="Пол">{GENDER_LABELS[profile.gender] || profile.gender}</ProfileRow>
        )}
        {profile.role && (
          <ProfileRow label="Роль">{profile.role === "ADMIN" ? "Модератор" : "Участник"}</ProfileRow>
        )}

        {isOwn && onThemeChange && (
          <div className="border-b border-slate-100 py-4 dark:border-slate-700">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Тема оформления
            </p>
            <div className="mt-3 flex items-center gap-3">
              <ThemeToggle theme={theme} onChange={onThemeChange} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {theme === "dark" ? "Тёмная" : "Светлая"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Настройка сохраняется в вашем аккаунте
            </p>
          </div>
        )}

        {profile.bio && (
          <div className="border-b border-slate-100 py-4 dark:border-slate-700">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">О себе</p>
            <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-slate-500 dark:text-slate-400">{profile.bio}</p>
          </div>
        )}

        <div className="pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Контакты</p>
          <OrganizerContacts event={contactEvent} />
        </div>

        {isOwn && (
          <div className="mt-8 flex flex-wrap gap-3">
            {onEdit && (
              <button type="button" className="btn-primary w-full sm:w-auto" onClick={onEdit}>
                Редактировать профиль
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 sm:w-auto"
                onClick={onLogout}
              >
                Выйти из аккаунта
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
