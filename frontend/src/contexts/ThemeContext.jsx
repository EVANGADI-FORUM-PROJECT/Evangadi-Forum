import { createContext, useContext, useState, useEffect } from "react";

/**
 * Theme Context providing the current theme ("light" | "dark") and a toggle.
 */
const ThemeContext = createContext(undefined);

const STORAGE_KEY = "theme";

// Use the saved choice if there is one, otherwise follow the OS setting.
const getInitialTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * ThemeProvider wraps the app so any component can read or change the theme.
 * It sets `data-theme` on <html>; the CSS variables in index.css do the rest.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const value = { theme, toggleTheme, isDark: theme === "dark" };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Custom hook to access the theme context.
 * @throws {Error} If used outside of ThemeProvider
 */
// eslint-disable-next-line react-refresh/only-export-components -- Keep the context hook beside its provider.
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
