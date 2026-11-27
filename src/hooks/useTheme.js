import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "portfolio-theme";
const LIGHT_THEME_COLOR = "#eef2f6";
const DARK_THEME_COLOR = "#070b12";

const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function getSystemDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readClientTheme() {
  if (typeof window === "undefined") return false;
  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === "dark" || domTheme === "light") return domTheme === "dark";
  const stored = getStoredTheme();
  if (stored) return stored === "dark";
  return getSystemDark();
}

function applyThemeToDom(isDark, explicitOverride = getStoredTheme()) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaColorScheme) {
    metaColorScheme.setAttribute("content", explicitOverride ?? "light dark");
  }

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
    // Only follow system changes when no explicit override is stored;
    // never retroactively delete a stored override when the OS happens to match it.
    if (!getStoredTheme()) {
      applyThemeToDom(event.matches, null);
      notifyListeners();
    }
  };
  const handleStorageChange = (event) => {
    if (event.key === STORAGE_KEY) {
      const stored = event.newValue === "dark" || event.newValue === "light" ? event.newValue : null;
      const nextDark = stored ? stored === "dark" : getSystemDark();
      applyThemeToDom(nextDark, stored);
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
    applyThemeToDom(darkMode, getStoredTheme());
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    const nextDark = !readClientTheme();
    const targetScheme = nextDark ? "dark" : "light";
    const systemDark = getSystemDark();
    // Two-state toggle: if the target matches the current OS preference,
    // remove the stored override so the site returns to following the system.
    const nextStored = nextDark === systemDark ? null : targetScheme;
    try {
      if (nextStored) {
        window.localStorage.setItem(STORAGE_KEY, nextStored);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore storage errors */ }
    applyThemeToDom(nextDark, nextStored);
    notifyListeners();
  }, []);

  return { darkMode, toggleDarkMode };
}
