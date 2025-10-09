"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

interface ThemeToggleProps {
  size?: "default" | "sm" | "lg" | "icon";
}

export function ThemeToggle({ size = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : size === "icon" ? "h-4 w-4" : "h-4 w-4";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        toggleTheme();
      }}
      className="cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun
          className={`${iconSize} text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors`}
        />
      ) : (
        <Moon
          className={`${iconSize} text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors`}
        />
      )}
    </div>
  );
}
