import { useState, useEffect } from "react";

type ThemeValue = "light" | "dark" | "system";

const resolveTheme = (value: ThemeValue): "light" | "dark" => {
  if (value === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return value;
};

export const useTheme = () => {
  const [themePreference, setThemePreference] = useState<ThemeValue>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("syncspace-theme") as ThemeValue | null;
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
      return "system";
    }
    return "system";
  });

  const [resolved, setResolved] = useState<"light" | "dark">(() => resolveTheme(themePreference));

  useEffect(() => {
    const apply = (pref: ThemeValue) => {
      const r = resolveTheme(pref);
      setResolved(r);
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(r);
      localStorage.setItem("syncspace-theme", pref);
    };

    apply(themePreference);

    if (themePreference === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [themePreference]);

  const setTheme = (value: ThemeValue) => setThemePreference(value);

  const toggleTheme = () => {
    setThemePreference((t) => {
      if (t === "dark") return "light";
      if (t === "light") return "dark";
      return resolveTheme("system") === "dark" ? "light" : "dark";
    });
  };

  return { theme: resolved, themePreference, setTheme, toggleTheme };
};
