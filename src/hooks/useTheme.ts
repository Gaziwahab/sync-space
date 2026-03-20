import { useState, useEffect } from "react";

type ThemeValue = "light" | "dark";

export const useTheme = () => {
  const [themePreference, setThemePreference] = useState<ThemeValue>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("syncspace-theme") as ThemeValue | null;
      if (stored === "light" || stored === "dark") return stored;
      return "dark"; // Default to dark mode
    }
    return "dark";
  });

  useEffect(() => {
    const apply = (pref: ThemeValue) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(pref);
      localStorage.setItem("syncspace-theme", pref);
    };

    apply(themePreference);
  }, [themePreference]);

  const setTheme = (value: ThemeValue) => setThemePreference(value);

  const toggleTheme = () => {
    setThemePreference((t) => (t === "dark" ? "light" : "dark"));
  };

  return { theme: themePreference, themePreference, setTheme, toggleTheme };
};
