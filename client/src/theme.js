import { THEME_KEY } from "./constants";

export const THEMES = ["light", "dark"];

export function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light";
}

export function getStoredTheme() {
  return normalizeTheme(localStorage.getItem(THEME_KEY));
}

export function applyTheme(theme) {
  const normalized = normalizeTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", normalized === "dark");
  root.dataset.theme = normalized;
  localStorage.setItem(THEME_KEY, normalized);
  return normalized;
}

export function initTheme() {
  return applyTheme(getStoredTheme());
}
