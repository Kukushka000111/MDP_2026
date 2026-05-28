import { PAGES } from "../constants";

export default function AppNav({ token, userRole, onNavigate }) {
  if (!token) return null;

  return (
    <section className="mb-4 flex flex-wrap gap-2 rounded-lg bg-white p-3 shadow">
      <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onNavigate(PAGES.FEED)}>Лента</button>
      <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onNavigate(PAGES.PROFILE)}>Аккаунт</button>
      <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onNavigate(PAGES.MY_EVENTS)}>Мои мероприятия</button>
      <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onNavigate(PAGES.ATTENDING)}>Куда я записан</button>
      <button className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => onNavigate(PAGES.FAVORITES)}>Избранное</button>
      {userRole === "ADMIN" && (
        <button className="rounded bg-amber-100 px-2 py-1 text-sm" onClick={() => onNavigate(PAGES.MODERATION)}>
          Панель модератора
        </button>
      )}
    </section>
  );
}
