import { PAGES } from "../constants";
import NotificationBell from "./NotificationBell";

export default function AppHeader({ token, userRole, onNavigate, onLogout, showToast }) {
  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button type="button" className="text-left" onClick={() => onNavigate(PAGES.FEED)}>
            <h1 className="text-xl font-semibold">Культурный Навигатор</h1>
            <p className="text-sm text-slate-300">Лента событий и интерактивная карта</p>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {!token ? (
              <>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
                  onClick={() => onNavigate(PAGES.LOGIN)}
                >
                  Вход
                </button>
                <button
                  type="button"
                  className="rounded bg-blue-500 px-3 py-1.5 text-sm hover:bg-blue-400"
                  onClick={() => onNavigate(PAGES.REGISTER)}
                >
                  Регистрация
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
                  onClick={() => onNavigate(PAGES.FEED)}
                >
                  Лента
                </button>
                <button
                  type="button"
                  className="rounded bg-emerald-600 px-3 py-1.5 text-sm hover:bg-emerald-500"
                  onClick={() => onNavigate(PAGES.CREATE_EVENT)}
                >
                  Создать мероприятие
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
                  onClick={() => onNavigate(PAGES.MY_EVENTS)}
                >
                  Мои мероприятия
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
                  onClick={() => onNavigate(PAGES.ATTENDING)}
                >
                  Мои заявки
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
                  onClick={() => onNavigate(PAGES.FAVORITES)}
                >
                  Избранное
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
                  onClick={() => onNavigate(PAGES.PROFILE)}
                >
                  Мой аккаунт
                </button>
                {userRole === "ADMIN" && (
                  <button
                    type="button"
                    className="rounded bg-amber-500 px-3 py-1.5 text-sm text-amber-950 hover:bg-amber-400"
                    onClick={() => onNavigate(PAGES.MODERATION)}
                  >
                    Модерация
                  </button>
                )}
                <NotificationBell token={token} showToast={showToast} />
                <button type="button" onClick={onLogout} className="rounded bg-rose-600 px-3 py-1.5 text-sm">
                  Выход
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
