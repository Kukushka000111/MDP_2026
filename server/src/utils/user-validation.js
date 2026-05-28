const NAME_REGEX = /^[A-Za-zА-Яа-яЁё\-]+$/;

function validatePersonName(value, label) {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 15) {
    return `${label}: от 2 до 15 символов`;
  }
  if (!NAME_REGEX.test(trimmed)) {
    return `${label}: только буквы и дефис`;
  }
  if (trimmed.includes("--")) {
    return `${label}: недопустим двойной дефис`;
  }
  if (/\s{2,}/.test(trimmed) || trimmed.includes(" ")) {
    return `${label}: укажите одно слово без пробелов`;
  }
  return null;
}

function validatePassword(password) {
  if (password.length < 8) {
    return "Пароль не менее 8 символов";
  }
  if (!/[a-zа-яё]/.test(password)) {
    return "Пароль должен содержать строчные буквы";
  }
  if (!/[A-ZА-ЯЁ]/.test(password)) {
    return "Пароль должен содержать прописные буквы";
  }
  if (!/\d/.test(password)) {
    return "Пароль должен содержать цифры";
  }
  if (!/[^A-Za-zА-Яа-яЁё0-9]/.test(password)) {
    return "Пароль должен содержать спецсимвол";
  }
  return null;
}

function validateLogin(login) {
  const trimmed = login.trim();
  if (trimmed.length < 6) {
    return "Логин не менее 6 символов";
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return "Логин: латиница, цифры, ._-";
  }
  return null;
}

module.exports = {
  validatePersonName,
  validatePassword,
  validateLogin,
  NAME_REGEX
};
