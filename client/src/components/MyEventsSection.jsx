import UserLink from "./UserLink";
import {
  moderationBadgePastel,
  moderationStatusLabel,
  MODERATION_MESSAGES,
  registrationStatusClass,
  registrationStatusLabel
} from "../utils";

function ModerationInlineNote({ item }) {
  if (item.moderation_status === "PENDING") return null;
  if (!item.moderation_comment && item.moderation_status === "APPROVED") return null;

  return (
    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <p>{MODERATION_MESSAGES[item.moderation_status]}</p>
      {item.moderation_comment && (
        <p className="mt-1">
          <strong>Комментарий:</strong> {item.moderation_comment}
        </p>
      )}
    </div>
  );
}

function ParticipantRow({ person, onReview, onOpenUser }) {
  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm">
      <div className="flex flex-wrap items-start gap-3">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-slate-900">
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
              className="font-medium text-slate-900"
            />
            <span className={`px-2 py-0.5 text-xs font-semibold ${registrationStatusClass(person.status)}`}>
              {registrationStatusLabel(person.status)}
            </span>
          </div>
          {person.login && <p className="text-xs text-slate-500">Логин: {person.login}</p>}
          {person.email && <p className="text-xs text-slate-500">{person.email}</p>}
          {person.phone && <p className="text-xs text-slate-500">Телефон: {person.phone}</p>}
          {person.telegram && <p className="text-xs text-slate-500">Telegram: {person.telegram}</p>}
          {person.message ? (
            <p className="mt-2 rounded-lg bg-white px-2 py-1.5 text-xs text-slate-700">
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
            className="status-positive px-3 py-1.5 text-xs font-semibold hover:bg-emerald-100"
            onClick={() => onReview(person.id, "APPROVED")}
          >
            Одобрить
          </button>
          <button
            type="button"
            className="rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
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
  return (
    <div className="space-y-4">
      {myEvents.map((item) => {
        const participants = participantsByEvent[item.id] || [];
        const pendingCount = participants.filter((p) => p.status === "PENDING").length;
        const dateStr = new Date(item.starts_at).toLocaleString("ru-RU", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit"
        });

        return (
          <article
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
            className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition ${
              item.moderation_status === "APPROVED"
                ? "cursor-pointer hover:border-indigo-200 hover:shadow-md"
                : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {dateStr} · участников: {item.registrations_count}
                  {item.event_type === "OFFICIAL" ? " · Официальное" : " · От жителей"}
                </p>
              </div>
              <span
                className={`shrink-0 px-3 py-1 text-xs font-bold ${moderationBadgePastel(item.moderation_status)}`}
              >
                {moderationStatusLabel(item.moderation_status)}
              </span>
            </div>

            <ModerationInlineNote item={item} />

            <div className="mt-4 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="rounded-2xl bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                onClick={() => onShowParticipants(item.id)}
              >
                Участники
                {pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="rounded-2xl bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                onClick={() => onEdit(item)}
              >
                Редактировать
              </button>
              {item.moderation_status === "APPROVED" && (
                <button
                  type="button"
                  className="rounded-2xl bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                  onClick={() => onOpen(item.id)}
                >
                  Открыть
                </button>
              )}
              <button
                type="button"
                className="rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                onClick={() => onDelete(item.id)}
              >
                Удалить
              </button>
            </div>

            {participants.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4" onClick={(event) => event.stopPropagation()}>
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
          </article>
        );
      })}
      {myEvents.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Пока нет созданных мероприятий. Нажмите «Создать» в шапке.
        </p>
      )}
    </div>
  );
}
