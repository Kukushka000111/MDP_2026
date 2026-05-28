import { useState } from "react";
import { login } from "../api";
import { PAGES } from "../constants";
import PasswordInput from "./PasswordInput";
import { fieldErrorClass } from "../utils";
import { validateLoginForm } from "../validation/userValidation";

export default function LoginPage({ onSuccess, onNavigate, showToast }) {
  const [form, setForm] = useState({ login: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLoginForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast(Object.values(nextErrors)[0], "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({
        login: form.login.trim(),
        password: form.password
      });
      onSuccess(result);
    } catch (error) {
      const message = error.message || "Ошибка входа";
      if (message.includes("логин") || message.includes("парол")) {
        setErrors({ login: message.includes("логин") ? message : "", password: message });
      }
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (field) =>
    `input-field ${fieldErrorClass(Boolean(errors[field]))}`;

  return (
    <section className="card-surface mx-auto mb-6 max-w-md p-8">
      <h2 className="section-heading mb-4 text-2xl">Вход</h2>
      <p className="mb-4 text-sm text-slate-500">
        Авторизация по логину и паролю. Сессия — JWT-токен (1 день).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Логин</label>
          <input
            className={inputCls("login")}
            value={form.login}
            onChange={(e) => setForm((p) => ({ ...p, login: e.target.value }))}
          />
          {errors.login && <p className="mt-1 text-xs text-rose-600">{errors.login}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
          <PasswordInput
            className="text-slate-900"
            hasError={Boolean(errors.password)}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            autoComplete="current-password"
          />
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50"
        >
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Нет аккаунта?{" "}
        <button type="button" className="font-semibold text-indigo-600 underline hover:text-indigo-700" onClick={() => onNavigate(PAGES.REGISTER)}>
          Регистрация
        </button>
      </p>
    </section>
  );
}
