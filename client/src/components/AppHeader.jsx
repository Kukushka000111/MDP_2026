import { PAGES } from "../constants";
import NotificationBell from "./NotificationBell";
import SiteLogo from "./SiteLogo";
import ThemeToggle from "./ThemeToggle";

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
      className={`text-sm font-medium transition-colors sm:text-base ${
        active
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
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
      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors sm:h-9 sm:w-9 ${
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
  showToast,
  theme,
  onThemeChange
}) {
  const avatarLetter = (profileInitial || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="relative z-[1000] shrink-0 border-b border-slate-100 bg-white px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 sm:gap-6">
        <button
          type="button"
          className="flex min-w-0 shrink items-center gap-2 text-left sm:gap-4"
          onClick={() => onNavigate(PAGES.FEED)}
        >
          <span className="sm:hidden">
            <SiteLogo size={40} />
          </span>
          <span className="hidden sm:inline">
            <SiteLogo size={56} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl lg:text-2xl">
              <span className="sm:hidden">Навигатор</span>
              <span className="hidden sm:inline">Культурный Навигатор</span>
            </h1>
            <p className="mt-0.5 hidden text-sm font-medium text-slate-500 dark:text-slate-400 sm:block sm:text-base">
              События рядом с вами · Кострома
            </p>
          </div>
        </button>

        {!token ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle theme={theme} onChange={onThemeChange} />
            <button
              type="button"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 sm:text-base"
              onClick={() => onNavigate(PAGES.LOGIN)}
            >
              Вход
            </button>
            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 sm:px-4 sm:py-2"
              onClick={() => onNavigate(PAGES.REGISTER)}
            >
              Регистрация
            </button>
          </div>
        ) : (
          <nav className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-4 lg:gap-7">
            <ThemeToggle theme={theme} onChange={onThemeChange} />
            <NavTextLink
              active={page === PAGES.FEED}
              onClick={() => onNavigate(PAGES.FEED)}
              className="hidden sm:inline-flex"
            >
              Лента
            </NavTextLink>

            <button
              type="button"
              onClick={() => onNavigate(PAGES.CREATE_EVENT)}
              aria-label="Создать мероприятие"
              className="rounded-xl bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 sm:px-4 sm:py-2"
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ Создать</span>
            </button>

            <NavTextLink
              active={page === PAGES.MY_EVENTS || page === PAGES.ATTENDING}
              onClick={() => onNavigate(PAGES.ATTENDING)}
              className="hidden min-[420px]:inline-flex"
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
              className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border font-bold text-sm transition-colors sm:h-9 sm:w-9 ${
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
