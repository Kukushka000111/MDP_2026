import { PAGES } from "../constants";
import NotificationBell from "./NotificationBell";

function IconHeart({ className, filled }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconShield({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function NavTextLink({ active, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-medium transition-colors ${
        active
          ? "text-indigo-600"
          : "text-slate-600 hover:text-indigo-600"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function IconNavButton({ active, label, onClick, children, hoverClass = "hover:text-indigo-600" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
        active ? "bg-indigo-50 text-indigo-600" : `text-slate-500 ${hoverClass}`
      }`}
    >
      {children}
    </button>
  );
}

export default function AppHeader({
  token,
  userRole,
  page,
  profileAvatarUrl,
  profileInitial,
  onNavigate,
  showToast
}) {
  const avatarLetter = (profileInitial || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="relative z-[1000] border-b border-slate-100 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button type="button" className="shrink-0 text-left" onClick={() => onNavigate(PAGES.FEED)}>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Культурный Навигатор</h1>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">События рядом с вами</p>
        </button>

        {!token ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="font-medium text-slate-600 transition-colors hover:text-indigo-600"
              onClick={() => onNavigate(PAGES.LOGIN)}
            >
              Вход
            </button>
            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md"
              onClick={() => onNavigate(PAGES.REGISTER)}
            >
              Регистрация
            </button>
          </div>
        ) : (
          <nav className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
            <NavTextLink active={page === PAGES.FEED} onClick={() => onNavigate(PAGES.FEED)}>
              Лента
            </NavTextLink>

            <button
              type="button"
              onClick={() => onNavigate(PAGES.CREATE_EVENT)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md"
            >
              + Создать
            </button>

            <NavTextLink
              active={page === PAGES.MY_EVENTS || page === PAGES.ATTENDING}
              onClick={() => onNavigate(PAGES.ATTENDING)}
            >
              Моё
            </NavTextLink>

            <IconNavButton
              active={page === PAGES.FAVORITES}
              label="Избранное"
              onClick={() => onNavigate(PAGES.FAVORITES)}
              hoverClass="hover:text-red-500"
            >
              <IconHeart className="h-5 w-5" filled={page === PAGES.FAVORITES} />
            </IconNavButton>

            {userRole === "ADMIN" && (
              <IconNavButton
                active={page === PAGES.MODERATION}
                label="Модерация"
                onClick={() => onNavigate(PAGES.MODERATION)}
              >
                <IconShield className="h-5 w-5" />
              </IconNavButton>
            )}

            <NotificationBell token={token} showToast={showToast} />

            <button
              type="button"
              onClick={() => onNavigate(PAGES.PROFILE)}
              aria-label="Профиль"
              title="Профиль"
              className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border font-bold text-sm transition-colors ${
                page === PAGES.PROFILE || page === PAGES.PROFILE_EDIT
                  ? "border-indigo-300 bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200"
                  : "border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              {profileAvatarUrl ? (
                <img src={profileAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                avatarLetter
              )}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
