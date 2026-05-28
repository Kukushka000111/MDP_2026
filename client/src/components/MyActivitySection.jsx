import MyEventsSection from "./MyEventsSection";
import { registrationStatusLabel, registrationStatusPillClass } from "../utils";

const tabClass = (active) =>
  `rounded-2xl px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
      : "text-slate-600 hover:text-slate-900"
  }`;

function AttendingCard({ item, onOpen }) {
  const dateStr = new Date(item.starts_at).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item.id);
        }
      }}
      className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="h-16 w-16 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 text-lg font-bold text-slate-900">
          {(item.title || "?").charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-slate-900">{item.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{dateStr}</p>
        {item.registration_message && (
          <p className="mt-1 truncate text-xs text-slate-500">«{item.registration_message}»</p>
        )}
      </div>
      <span
        className={`shrink-0 px-3 py-1 text-xs font-bold ${registrationStatusPillClass(item.registration_status)}`}
      >
        {registrationStatusLabel(item.registration_status)}
      </span>
    </article>
  );
}

export default function MyActivitySection({
  activeTab,
  onTabChange,
  myEvents,
  myAttending,
  participantsByEvent,
  onShowParticipants,
  onReviewRegistration,
  onEdit,
  onOpen,
  onDelete,
  onOpenUser
}) {
  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="section-heading text-2xl sm:text-3xl">Моё</h2>
        <p className="mt-1 text-sm text-slate-500">Заявки на события и мероприятия, которые вы организуете</p>
      </div>

      <div className="inline-flex gap-1 rounded-2xl bg-slate-100 p-1">
        <button type="button" className={tabClass(activeTab === "attending")} onClick={() => onTabChange("attending")}>
          Я иду
        </button>
        <button type="button" className={tabClass(activeTab === "organizing")} onClick={() => onTabChange("organizing")}>
          Я организую
        </button>
      </div>

      {activeTab === "attending" ? (
        <div className="space-y-3">
          {myAttending.map((item) => (
            <AttendingCard key={item.id} item={item} onOpen={onOpen} />
          ))}
          {myAttending.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Вы ещё не записывались на мероприятия. Откройте ленту и выберите событие.
            </p>
          )}
        </div>
      ) : (
        <MyEventsSection
          myEvents={myEvents}
          participantsByEvent={participantsByEvent}
          onShowParticipants={onShowParticipants}
          onReviewRegistration={onReviewRegistration}
          onEdit={onEdit}
          onOpen={onOpen}
          onDelete={onDelete}
          onOpenUser={onOpenUser}
        />
      )}
    </section>
  );
}
