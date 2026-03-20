import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const ThemeToggle = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
  (props, ref) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
      <button
        ref={ref}
        onClick={toggleTheme}
        className={`relative inline-flex h-8 w-14 shrinking-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 clay-inset ${isDark ? "bg-primary/20" : "bg-muted"}`}
        aria-label="Toggle theme"
        {...props}
      >
        <div
          className={`pointer-events-none absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-sm transition-transform duration-300 ease-in-out ${isDark ? "translate-x-6 bg-primary text-primary-foreground" : "translate-x-0"}`}
        >
          {isDark ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </button>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;
