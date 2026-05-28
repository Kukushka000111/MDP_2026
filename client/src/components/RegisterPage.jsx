import { useEffect, useState } from "react";
import { checkAuthAvailability, getCaptcha, register } from "../api";
import { PAGES } from "../constants";
import PasswordInput from "./PasswordInput";
import { fieldErrorClass } from "../utils";
import { validateLogin, validateRegisterForm } from "../validation/userValidation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export default function RegisterPage({ onSuccess, onNavigate, showToast }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    login: "",
    password: "",
    passwordConfirm: "",
    acceptRules: false,
    ageStatus: "",
    gender: "",
    captchaAnswer: ""
  });
  const [captcha, setCaptcha] = useState({ captchaId: "", question: "" });
  const [errors, setErrors] = useState({});
  const [availability, setAvailability] = useState({ email: null, login: null });
  const [checking, setChecking] = useState({ email: false, login: false });
  const [submitting, setSubmitting] = useState(false);

  async function loadCaptcha() {
    try {
      const data = await getCaptcha();
      setCaptcha({ captchaId: data.captchaId, question: data.question });
      setForm((prev) => ({ ...prev, captchaAnswer: "" }));
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  useEffect(() => {
    const email = form.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setAvailability((prev) => ({ ...prev, email: null }));
      return undefined;
    }
    setChecking((prev) => ({ ...prev, email: true }));
    const timer = setTimeout(async () => {
      const result = await checkAuthAvailability("email", email);
      setAvailability((prev) => ({ ...prev, email: result.available }));
      setChecking((prev) => ({ ...prev, email: false }));
    }, 450);
    return () => clearTimeout(timer);
  }, [form.email]);

  useEffect(() => {
    const login = form.login.trim().toLowerCase();
    if (login.length < 6) {
      setAvailability((prev) => ({ ...prev, login: null }));
      return undefined;
    }
    setChecking((prev) => ({ ...prev, login: true }));
    const timer = setTimeout(async () => {
      const result = await checkAuthAvailability("login", login);
      setAvailability((prev) => ({ ...prev, login: result.available }));
      setChecking((prev) => ({ ...prev, login: false }));
    }, 450);
    return () => clearTimeout(timer);
  }, [form.login]);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateRegisterForm(form, availability);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast(Object.values(nextErrors)[0], "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await register({
        firstName: form.firstName.trim().replace(/\s+/g, " "),
        lastName: form.lastName.trim().replace(/\s+/g, " "),
        email: form.email.trim(),
        login: form.login.trim(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        acceptRules: form.acceptRules,
        ageStatus: form.ageStatus,
        gender: form.gender,
        captchaId: captcha.captchaId,
        captchaAnswer: form.captchaAnswer
      });
      onSuccess(result);
    } catch (error) {
      showToast(error.message, "error");
      if (error.message.includes("капч")) loadCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (field) =>
    `input-field ${fieldErrorClass(Boolean(errors[field]))}`;

  const loginFormatHint = form.login.trim() ? validateLogin(form.login) : "";
  const loginTaken = availability.login === false;
  const loginFree = availability.login === true && form.login.trim().length >= 6 && !loginFormatHint;
  const canSubmit = !checking.email && !checking.login && !submitting;

  return (
    <section className="card-surface mx-auto mb-6 max-w-xl p-8">
      <h2 className="section-heading mb-1 text-2xl">Регистрация</h2>
      <p className="mb-4 text-sm text-slate-500">
        После регистрации заполните контакты в профиле — они подставятся при создании мероприятий.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя *" error={errors.firstName}>
            <input
              className={inputCls("firstName")}
              placeholder="Иван или Анна Мария"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            />
          </Field>
          <Field label="Фамилия *" error={errors.lastName}>
            <input
              className={inputCls("lastName")}
              placeholder="Иванов или Петров Сидоров"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            />
          </Field>
        </div>

        <Field
          label="Email *"
          error={errors.email || (availability.email === false ? "Этот email уже занят" : "")}
        >
          <input
            type="email"
            className={inputCls("email")}
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          {checking.email && <p className="mt-1 text-xs text-slate-400">Проверка email...</p>}
          {availability.email === true && form.email && (
            <p className="mt-1 text-xs text-emerald-600">Email свободен</p>
          )}
        </Field>

        <Field
          label="Логин *"
          error={
            errors.login
            || loginFormatHint
            || (loginTaken ? "Этот логин уже занят" : "")
          }
        >
          <input
            className={`input-field ${
              errors.login || loginFormatHint || loginTaken
                ? "border-rose-500 ring-1 ring-rose-300"
                : loginFree
                  ? "border-emerald-500 ring-1 ring-emerald-200"
                  : "border-slate-300"
            }`}
            value={form.login}
            onChange={(e) => setForm((p) => ({ ...p, login: e.target.value.replace(/\s/g, "") }))}
            autoComplete="username"
          />
          {checking.login && <p className="mt-1 text-xs text-slate-400">Проверка логина...</p>}
          {!checking.login && loginFree && (
            <p className="mt-1 text-xs text-emerald-600">Логин свободен</p>
          )}
          {!checking.login && !loginFormatHint && loginTaken && (
            <p className="mt-1 text-xs text-rose-600">Логин занят — выберите другой</p>
          )}
        </Field>

        <Field label="Пароль *" error={errors.password}>
          <PasswordInput
            className="text-slate-900"
            hasError={Boolean(errors.password)}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-slate-400">
            Минимум 8 символов: прописные, строчные, цифры и спецсимвол
          </p>
        </Field>

        <Field label="Подтверждение пароля *" error={errors.passwordConfirm}>
          <PasswordInput
            className="text-slate-900"
            hasError={Boolean(errors.passwordConfirm)}
            value={form.passwordConfirm}
            onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
            autoComplete="new-password"
          />
        </Field>

        <Field label="Возраст *" error={errors.ageStatus}>
          <select
            className={inputCls("ageStatus")}
            value={form.ageStatus}
            onChange={(e) => setForm((p) => ({ ...p, ageStatus: e.target.value }))}
          >
            <option value="">Выберите...</option>
            <option value="adult">Мне 18 лет</option>
            <option value="minor">Нет 18 лет</option>
          </select>
        </Field>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">Пол *</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value="MALE"
                checked={form.gender === "MALE"}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              />
              Мужской
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value="FEMALE"
                checked={form.gender === "FEMALE"}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              />
              Женский
            </label>
          </div>
          {errors.gender && <p className="mt-1 text-xs text-rose-600">{errors.gender}</p>}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.acceptRules}
            onChange={(e) => setForm((p) => ({ ...p, acceptRules: e.target.checked }))}
          />
          <span>Принимаю правила сервиса и политику обработки данных</span>
        </label>
        {errors.acceptRules && <p className="text-xs text-rose-600">{errors.acceptRules}</p>}

        <Field label="Проверка (капча) *" error={errors.captchaAnswer}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-medium">{captcha.question || "..."}</span>
            <input
              className={`input-field w-24 ${fieldErrorClass(Boolean(errors.captchaAnswer))}`}
              inputMode="numeric"
              value={form.captchaAnswer}
              onChange={(e) => setForm((p) => ({ ...p, captchaAnswer: e.target.value }))}
            />
            <button type="button" className="text-xs text-blue-600 underline" onClick={loadCaptcha}>
              Другой пример
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full disabled:opacity-50"
        >
          {submitting ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Уже есть аккаунт?{" "}
        <button type="button" className="font-semibold text-indigo-600 underline hover:text-indigo-700" onClick={() => onNavigate(PAGES.LOGIN)}>
          Войти
        </button>
      </p>
    </section>
  );
}
