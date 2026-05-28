export default function AppHeader({ token, authForm, setAuthForm, onAuthSubmit, onLogout }) {
  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Культурный Навигатор</h1>
          <p className="text-sm text-slate-300">Лента событий и интерактивная карта</p>
        </div>
        {!token ? (
          <form onSubmit={onAuthSubmit} className="flex flex-wrap items-center gap-2">
            {authForm.mode === "register" && (
              <input
                className="rounded px-2 py-1 text-sm text-slate-900"
                placeholder="Имя"
                value={authForm.displayName}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, displayName: event.target.value }))}
              />
            )}
            <input
              className="rounded px-2 py-1 text-sm text-slate-900"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              className="rounded px-2 py-1 text-sm text-slate-900"
              type="password"
              placeholder="Пароль"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button type="submit" className="rounded bg-blue-500 px-2 py-1 text-sm">
              {authForm.mode === "register" ? "Регистрация" : "Вход"}
            </button>
            <button
              type="button"
              className="rounded bg-slate-700 px-2 py-1 text-sm"
              onClick={() => setAuthForm((prev) => ({ ...prev, mode: prev.mode === "register" ? "login" : "register" }))}
            >
              {authForm.mode === "register" ? "Есть аккаунт" : "Создать"}
            </button>
          </form>
        ) : (
          <button type="button" onClick={onLogout} className="rounded bg-rose-600 px-2 py-1 text-sm">
            Выход
          </button>
        )}
      </div>
    </header>
  );
}
