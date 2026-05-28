import OrganizerContacts from "./OrganizerContacts";
import { organizerEventsLabel, platformTenureLabel } from "../utils";

const GENDER_LABELS = { MALE: "Мужской", FEMALE: "Женский" };

export default function UserProfileView({
  profile,
  isOwn,
  onEdit,
  onBack
}) {
  if (!profile) {
    return <p className="text-sm text-slate-500">Загрузка профиля…</p>;
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
    <section className="mb-4 rounded-lg bg-white p-6 shadow">
      {onBack && (
        <button type="button" className="mb-4 rounded bg-slate-100 px-3 py-1 text-sm" onClick={onBack}>
          Назад
        </button>
      )}

      <div className="flex flex-wrap items-start gap-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-28 w-28 rounded-full border object-cover" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-indigo-100 text-4xl font-semibold text-indigo-700">
            {(name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-sm text-slate-500">@{profile.login}</p>
          <p className="mt-1 text-sm text-slate-600">{platformTenureLabel(profile.created_at)}</p>
          <p className="text-sm text-indigo-700">{organizerEventsLabel(profile.events_organized_count)}</p>
          {verified && (
            <p className="mt-1 text-sm font-medium text-emerald-700">✓ Подтверждённый организатор</p>
          )}
        </div>
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        {profile.email && (
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd>{profile.email}</dd>
          </div>
        )}
        {profile.gender && (
          <div>
            <dt className="text-slate-500">Пол</dt>
            <dd>{GENDER_LABELS[profile.gender] || profile.gender}</dd>
          </div>
        )}
        {profile.role && (
          <div>
            <dt className="text-slate-500">Роль</dt>
            <dd>{profile.role === "ADMIN" ? "Модератор" : "Участник"}</dd>
          </div>
        )}
      </dl>

      {profile.bio && (
        <div className="mt-4">
          <h3 className="mb-1 text-sm font-medium text-slate-700">О себе</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-medium text-slate-700">Контакты</h3>
        <OrganizerContacts event={contactEvent} />
      </div>

      {isOwn && onEdit && (
        <button
          type="button"
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          onClick={onEdit}
        >
          Редактировать профиль
        </button>
      )}
    </section>
  );
}
