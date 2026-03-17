import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

const ThemeToggle = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  (props, ref) => {
    const { theme, toggleTheme } = useTheme();

    return (
      <Button ref={ref} variant="ghost" size="icon" onClick={toggleTheme} className="relative" {...props}>
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;
