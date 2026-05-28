import { PAGES } from "../constants";

export default function AppFooter({ token, onNavigate }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-bold text-slate-900">Культурный Навигатор</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Агрегатор городских мероприятий в Костроме: лента, карта, запись и отзывы.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <button
            type="button"
            className="font-medium text-slate-600 transition-colors hover:text-indigo-600"
            onClick={() => onNavigate(PAGES.FEED)}
          >
            Лента
          </button>
          {token && (
            <>
              <button
                type="button"
                className="font-medium text-slate-600 transition-colors hover:text-indigo-600"
                onClick={() => onNavigate(PAGES.CREATE_EVENT)}
              >
                Создать событие
              </button>
              <button
                type="button"
                className="font-medium text-slate-600 transition-colors hover:text-indigo-600"
                onClick={() => onNavigate(PAGES.ATTENDING)}
              >
                Моё
              </button>
              <button
                type="button"
                className="font-medium text-slate-600 transition-colors hover:text-indigo-600"
                onClick={() => onNavigate(PAGES.FAVORITES)}
              >
                Избранное
              </button>
            </>
          )}
          {!token && (
            <button
              type="button"
              className="font-medium text-slate-600 transition-colors hover:text-indigo-600"
              onClick={() => onNavigate(PAGES.LOGIN)}
            >
              Вход
            </button>
          )}
        </nav>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-6 py-4 text-center text-xs text-slate-500 sm:text-left">
          © {year} Культурный Навигатор · Курсовой проект МДП
        </div>
      </div>
    </footer>
  );
}
