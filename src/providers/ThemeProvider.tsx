"use client";

import { createContext, useContext, useEffect, useState } from "react";
import logger from "@/lib/logger";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    logger.info('ThemeProvider mounting');
    
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme;
      logger.info('Retrieved saved theme from localStorage', { savedTheme });
      
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      logger.error('Error accessing localStorage in ThemeProvider', error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    logger.info('Applying theme to document', { theme, mounted });

    try {
      const root = window.document.documentElement;

      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";

        logger.info('Using system theme', { systemTheme });
        root.classList.add(systemTheme);
        return;
      }

      root.classList.add(theme);
      logger.info('Applied theme class', { theme });
    } catch (error) {
      logger.error('Error applying theme', error);
    }
  }, [theme, mounted]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (mounted) {
        localStorage.setItem(storageKey, theme);
      }
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
