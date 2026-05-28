import { moderationStatusClass, moderationStatusLabel } from "../utils";

export default function MyEventsSection({
  myEvents,
  participantsByEvent,
  onShowParticipants,
  onEdit,
  onOpen,
  onDelete
}) {
  return (
    <section className="mb-4 rounded-lg bg-white p-4 shadow">
      <h2 className="mb-2 text-lg font-semibold">Мои мероприятия</h2>
      {myEvents.map((item) => (
        <div key={item.id} className="mb-2 rounded border p-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium">{item.title}</p>
            <span className={`rounded px-2 py-0.5 text-xs ${moderationStatusClass(item.moderation_status)}`}>
              {moderationStatusLabel(item.moderation_status)}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(item.starts_at).toLocaleString("ru-RU")} · записались: {item.registrations_count}
          </p>
          {item.moderation_comment && (
            <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
              Комментарий модератора: {item.moderation_comment}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded bg-slate-100 px-2 py-1 text-xs" onClick={() => onShowParticipants(item.id)}>Кто идёт</button>
            <button className="rounded bg-indigo-100 px-2 py-1 text-xs" onClick={() => onEdit(item)}>Редактировать</button>
            {item.moderation_status === "APPROVED" && (
              <button className="rounded bg-indigo-50 px-2 py-1 text-xs" onClick={() => onOpen(item.id)}>Открыть</button>
            )}
            <button className="rounded bg-rose-100 px-2 py-1 text-xs" onClick={() => onDelete(item.id)}>Удалить</button>
          </div>
          {(participantsByEvent[item.id] || []).map((person) => (
            <p key={person.id} className="text-xs">{person.display_name} ({person.email})</p>
          ))}
        </div>
      ))}
      {myEvents.length === 0 && <p className="text-sm text-slate-500">Пока нет созданных мероприятий.</p>}
    </section>
  );
}
