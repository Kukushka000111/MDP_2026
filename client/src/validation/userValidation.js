const NAME_PART_REGEX = /^[A-Za-zА-Яа-яЁё\-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_REGEX = /^[A-Za-z0-9_.-]+$/;

export function validatePersonName(value, label) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 40) {
    return `${label}: от 2 до 40 символов`;
  }
  const parts = trimmed.split(" ");
  if (parts.length > 2) {
    return `${label}: не более двух слов (например, имя и отчество)`;
  }
  for (const part of parts) {
    if (part.length < 2) {
      return `${label}: каждая часть — не короче 2 символов`;
    }
    if (!NAME_PART_REGEX.test(part)) {
      return `${label}: только буквы и дефис`;
    }
    if (part.includes("--")) {
      return `${label}: недопустим двойной дефис`;
    }
  }
  return "";
}

export function validatePassword(password) {
  if (password.length < 8) return "Пароль не менее 8 символов";
  if (!/[a-zа-яё]/.test(password)) return "Нужны строчные буквы";
  if (!/[A-ZА-ЯЁ]/.test(password)) return "Нужны прописные буквы";
  if (!/\d/.test(password)) return "Нужны цифры";
  if (!/[^A-Za-zА-Яа-яЁё0-9]/.test(password)) return "Нужен спецсимвол";
  return "";
}

export function validateLogin(login) {
  const trimmed = login.trim();
  if (trimmed.length < 6) return "Логин не менее 6 символов";
  if (!LOGIN_REGEX.test(trimmed)) return "Логин: латиница, цифры, ._-";
  return "";
}

export function validateRegisterForm(form, availability = {}) {
  const errors = {};

  const first = validatePersonName(form.firstName, "Имя");
  if (first) errors.firstName = first;

  const last = validatePersonName(form.lastName, "Фамилия");
  if (last) errors.lastName = last;

  if (!form.email.trim()) {
    errors.email = "Укажите email";
  } else if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Некорректный email";
  } else if (availability.email === false) {
    errors.email = "Этот email уже занят";
  } else if (availability.email == null && EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Дождитесь проверки email";
  }

  const loginErr = validateLogin(form.login);
  if (loginErr) errors.login = loginErr;
  else if (availability.login === false) {
    errors.login = "Этот логин уже занят";
  } else if (availability.login == null && form.login.trim().length >= 6) {
    errors.login = "Дождитесь проверки логина";
  }

  const passErr = validatePassword(form.password);
  if (passErr) errors.password = passErr;

  if (!form.passwordConfirm) {
    errors.passwordConfirm = "Подтвердите пароль";
  } else if (form.password !== form.passwordConfirm) {
    errors.passwordConfirm = "Пароли не совпадают";
  }

  if (!form.acceptRules) {
    errors.acceptRules = "Примите правила сервиса";
  }

  if (!form.ageStatus) {
    errors.ageStatus = "Укажите возраст";
  } else if (form.ageStatus === "minor") {
    errors.ageStatus = "Регистрация доступна с 18 лет";
  }

  if (!form.gender) {
    errors.gender = "Укажите пол";
  }

  if (!form.captchaAnswer?.toString().trim()) {
    errors.captchaAnswer = "Решите пример";
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = {};
  if (!form.login.trim()) errors.login = "Введите логин";
  const loginErr = validateLogin(form.login);
  if (!errors.login && loginErr) errors.login = loginErr;
  if (!form.password) errors.password = "Введите пароль";
  return errors;
}
