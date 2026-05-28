import SiteLogo from "./SiteLogo";

const FEATURES = [
  "Лента мероприятий",
  "Карта Костромы",
  "Запись и заявки",
  "Избранное",
  "Отзывы участников"
];

export default function AppFooter({ compact = false }) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="mt-auto shrink-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Культурный Навигатор</span>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <span>Кострома</span>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <span>© {year} МДП</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto shrink-0 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SiteLogo size={40} />
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">Культурный Навигатор</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Агрегатор городских событий: находите интересное рядом, записывайтесь и делитесь впечатлениями.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Возможности</p>
              <ul className="mt-2 space-y-1">
                {FEATURES.map((label) => (
                  <li key={label} className="text-sm text-slate-600 dark:text-slate-400">
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">О сервисе</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Официальные и городские события</li>
                <li>Премодерация публикаций</li>
                <li>Профили организаторов</li>
                <li>Уведомления о заявках</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-slate-200 pt-4 text-center text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-700">
          <span>Кострома</span>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <span>Культурный навигатор</span>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <span>МДП {year}</span>
        </div>
      </div>
    </footer>
  );
}
