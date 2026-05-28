import UserLink from "./UserLink";
import {
  moderationBannerClass,
  moderationStatusClass,
  moderationStatusLabel,
  MODERATION_MESSAGES,
  registrationStatusClass,
  registrationStatusLabel
} from "../utils";

function ModerationNotice({ item }) {
  if (item.moderation_status === "PENDING") return null;

  return (
    <div className={`mt-2 rounded border px-3 py-2 text-sm ${moderationBannerClass(item.moderation_status)}`}>
      <p className="font-medium">{moderationStatusLabel(item.moderation_status)}</p>
      <p className="mt-0.5 text-xs opacity-90">{MODERATION_MESSAGES[item.moderation_status]}</p>
      {item.moderation_comment && (
        <p className="mt-1 text-xs">
          <strong>Комментарий модератора:</strong> {item.moderation_comment}
        </p>
      )}
      {item.moderated_at && (
        <p className="mt-1 text-xs opacity-75">
          Решение: {new Date(item.moderated_at).toLocaleString("ru-RU")}
        </p>
      )}
    </div>
  );
}

function ParticipantRow({ person, onReview, onOpenUser }) {
  return (
    <li className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
      <div className="flex flex-wrap items-start gap-3">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {(person.display_name || person.login || "?").charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <UserLink
              userId={person.id}
              name={person.display_name || person.login}
              avatarUrl={person.avatar_url}
              onOpenUser={onOpenUser}
              className="font-medium"
            />
            <span className={`rounded px-2 py-0.5 text-xs ${registrationStatusClass(person.status)}`}>
              {registrationStatusLabel(person.status)}
            </span>
          </div>
          {person.login && <p className="text-xs text-slate-500">Логин: {person.login}</p>}
          {person.email && <p className="text-xs text-slate-500">{person.email}</p>}
          {person.phone && <p className="text-xs text-slate-500">Телефон: {person.phone}</p>}
          {person.telegram && <p className="text-xs text-slate-500">Telegram: {person.telegram}</p>}
          {person.message ? (
            <p className="mt-2 rounded bg-white px-2 py-1.5 text-xs text-slate-700">
              <strong>Сообщение:</strong> {person.message}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-slate-400">Без сообщения</p>
          )}
        </div>
      </div>
      {person.status === "PENDING" && onReview && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="rounded bg-emerald-600 px-3 py-1 text-xs text-white"
            onClick={() => onReview(person.id, "APPROVED")}
          >
            Одобрить
          </button>
          <button
            type="button"
            className="rounded bg-rose-100 px-3 py-1 text-xs text-rose-800"
            onClick={() => onReview(person.id, "REJECTED")}
          >
            Отклонить
          </button>
        </div>
      )}
    </li>
  );
}

export default function MyEventsSection({
  myEvents,
  participantsByEvent,
  onShowParticipants,
  onReviewRegistration,
  onEdit,
  onOpen,
  onDelete,
  onOpenUser
}) {
  const notifications = myEvents.filter((item) => item.moderation_status !== "PENDING");

  return (
    <section className="mb-4 space-y-4">
      {notifications.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-indigo-950">Уведомления о модерации</h2>
          <p className="mb-3 text-sm text-indigo-900">
            Решения по вашим мероприятиям ({notifications.length}):
          </p>
          <ul className="space-y-2">
            {notifications.map((item) => (
              <li key={`notice-${item.id}`} className="rounded border border-indigo-100 bg-white p-3 text-sm">
                <p className="font-medium">{item.title}</p>
                <ModerationNotice item={item} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 text-lg font-semibold">Мои мероприятия</h2>
        {myEvents.map((item) => {
          const participants = participantsByEvent[item.id] || [];
          const pendingCount = participants.filter((p) => p.status === "PENDING").length;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => item.moderation_status === "APPROVED" && onOpen(item.id)}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && item.moderation_status === "APPROVED") {
                  event.preventDefault();
                  onOpen(item.id);
                }
              }}
              className={`mb-3 rounded-lg border p-3 ${
                item.moderation_status === "APPROVED"
                  ? "cursor-pointer border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <span className={`rounded px-2 py-0.5 text-xs ${moderationStatusClass(item.moderation_status)}`}>
                  {moderationStatusLabel(item.moderation_status)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {new Date(item.starts_at).toLocaleString("ru-RU")} · участников: {item.registrations_count}
                {item.event_type === "OFFICIAL" ? " · Официальное" : " · От жителей"}
              </p>
              <ModerationNotice item={item} />
              <div className="mt-2 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="rounded bg-slate-100 px-2 py-1 text-xs"
                  onClick={() => onShowParticipants(item.id)}
                >
                  Заявки и участники
                  {pendingCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-white">{pendingCount}</span>
                  )}
                </button>
                <button type="button" className="rounded bg-indigo-100 px-2 py-1 text-xs" onClick={() => onEdit(item)}>
                  Редактировать
                </button>
                {item.moderation_status === "APPROVED" && (
                  <button type="button" className="rounded bg-indigo-50 px-2 py-1 text-xs" onClick={() => onOpen(item.id)}>
                    Открыть
                  </button>
                )}
                <button type="button" className="rounded bg-rose-100 px-2 py-1 text-xs" onClick={() => onDelete(item.id)}>
                  Удалить
                </button>
              </div>
              {participants.length > 0 && (
                <ul className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
                  {participants.map((person) => (
                    <ParticipantRow
                      key={person.id}
                      person={person}
                      onReview={
                        onReviewRegistration
                          ? (userId, status) => onReviewRegistration(item.id, userId, status)
                          : null
                      }
                      onOpenUser={onOpenUser}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {myEvents.length === 0 && <p className="text-sm text-slate-500">Пока нет созданных мероприятий.</p>}
      </div>
    </section>
  );
}
