import { PAGES } from "../constants";
import NotificationBell from "./NotificationBell";

function NavButton({ active, children, onClick, primary }) {
  if (primary) {
    return (
      <button type="button" className="btn-primary px-5 py-2 text-xs sm:text-sm" onClick={onClick}>
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={active ? "btn-nav-active text-xs sm:text-sm" : "btn-nav text-xs sm:text-sm"}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function AppHeader({ token, userRole, page, onNavigate, onLogout, showToast }) {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button type="button" className="text-left" onClick={() => onNavigate(PAGES.FEED)}>
            <h1 className="text-xl font-black tracking-tight text-[#054752] sm:text-2xl">Культурный Навигатор</h1>
            <p className="text-sm font-medium text-slate-500">События рядом с вами</p>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {!token ? (
              <>
                <button type="button" className="btn-secondary px-5 py-2.5 text-sm" onClick={() => onNavigate(PAGES.LOGIN)}>
                  Вход
                </button>
                <button type="button" className="btn-primary px-5 py-2.5 text-sm" onClick={() => onNavigate(PAGES.REGISTER)}>
                  Регистрация
                </button>
              </>
            ) : (
              <>
                <NavButton active={page === PAGES.FEED} onClick={() => onNavigate(PAGES.FEED)}>
                  Лента
                </NavButton>
                <NavButton primary onClick={() => onNavigate(PAGES.CREATE_EVENT)}>
                  Создать
                </NavButton>
                <NavButton active={page === PAGES.MY_EVENTS} onClick={() => onNavigate(PAGES.MY_EVENTS)}>
                  Мои
                </NavButton>
                <NavButton active={page === PAGES.ATTENDING} onClick={() => onNavigate(PAGES.ATTENDING)}>
                  Заявки
                </NavButton>
                <NavButton active={page === PAGES.FAVORITES} onClick={() => onNavigate(PAGES.FAVORITES)}>
                  ★
                </NavButton>
                <NavButton active={page === PAGES.PROFILE} onClick={() => onNavigate(PAGES.PROFILE)}>
                  Профиль
                </NavButton>
                {userRole === "ADMIN" && (
                  <NavButton active={page === PAGES.MODERATION} onClick={() => onNavigate(PAGES.MODERATION)}>
                    Модерация
                  </NavButton>
                )}
                <NotificationBell token={token} showToast={showToast} />
                <button type="button" onClick={onLogout} className="btn-ghost text-rose-600 hover:bg-rose-50">
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
