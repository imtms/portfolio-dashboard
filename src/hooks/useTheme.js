import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "portfolio-theme";
const LIGHT_THEME_COLOR = "#eef2f6";
const DARK_THEME_COLOR = "#070b12";

const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function readClientTheme() {
  if (typeof window === "undefined") return false;
  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === "dark" || domTheme === "light") return domTheme === "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored === "dark";
  } catch { /* ignore storage errors */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeToDom(isDark) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }
}

function subscribe(listener) {
  listeners.add(listener);
  if (typeof window === "undefined") return () => listeners.delete(listener);

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleMediaChange = (event) => {
    let hasStored = false;
    try {
      hasStored = Boolean(window.localStorage.getItem(STORAGE_KEY));
    } catch { /* ignore storage errors */ }
    if (!hasStored) {
      applyThemeToDom(event.matches);
      notifyListeners();
    }
  };
  const handleStorageChange = (event) => {
    if (event.key === STORAGE_KEY) {
      applyThemeToDom(event.newValue === "dark");
      notifyListeners();
    }
  };

  mediaQuery.addEventListener?.("change", handleMediaChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    listeners.delete(listener);
    mediaQuery.removeEventListener?.("change", handleMediaChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

export function useTheme() {
  const darkMode = useSyncExternalStore(subscribe, readClientTheme, () => false);

  useEffect(() => {
    applyThemeToDom(darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    const next = !readClientTheme();
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch { /* ignore storage errors */ }
    applyThemeToDom(next);
    notifyListeners();
  }, []);

  return { darkMode, toggleDarkMode };
}
