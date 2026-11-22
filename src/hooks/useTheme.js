import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "portfolio-theme";

function readInitialTheme() {
  if (typeof window === "undefined") return false;
  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === "dark" || domTheme === "light") return domTheme === "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored === "dark";
  } catch { /* ignore storage errors */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme() {
  const [darkMode, setDarkMode] = useState(readInitialTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          setDarkMode(event.matches);
        }
      } catch {
        setDarkMode(event.matches);
      }
    };
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", darkMode ? "#090d16" : "#f8fafc");
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      } catch { /* ignore storage errors */ }
      document.documentElement.dataset.theme = next ? "dark" : "light";
      return next;
    });
  }, []);

  return { darkMode, toggleDarkMode };
}
