"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  useEffect(() => {
    const stored = window.localStorage.getItem("keyframe-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.classList.toggle("dark", stored === "dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const nextTheme = isDark ? "light" : "dark";
    window.localStorage.setItem("keyframe-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <Button
      size="icon"
      variant="outline"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="text-card-foreground"
    >
      <Sun size={16} className="hidden dark:block" />
      <Moon size={16} className="block dark:hidden" />
    </Button>
  );
}
