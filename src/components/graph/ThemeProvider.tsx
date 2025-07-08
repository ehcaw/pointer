"use client";

import type React from "react";

import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeContextProps {
  theme?: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: undefined,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps extends React.PropsWithChildren {
  [key: string]: any;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeContextProps["theme"]>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTheme(
        (localStorage.getItem("theme") as "light" | "dark" | "system") ||
          "system",
      );
    }
  }, []);

  return (
    <NextThemesProvider {...props} value={{ theme, setTheme }}>
      {children}
    </NextThemesProvider>
  );
}
