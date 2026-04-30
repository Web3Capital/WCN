"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const t = useTranslations("nav");
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)wcn_theme=(light|dark|system)(?:;|$)/);
    setTheme((m?.[1] as Theme) ?? "system");
    setMounted(true);
  }, []);

  async function pick(next: Theme) {
    if (next === theme) return;
    setTheme(next);
    await fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    });
    window.location.reload();
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const triggerLabel = theme === "dark" ? t("switchToLight") : t("switchToDark");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={triggerLabel}
          suppressHydrationWarning
        >
          {mounted ? <Icon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        {(Object.keys(THEME_LABELS) as Theme[]).map((mode) => {
          const ModeIcon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
          return (
            <DropdownMenuItem
              key={mode}
              onSelect={() => pick(mode)}
              data-active={theme === mode || undefined}
              className="data-[active]:bg-accent data-[active]:font-medium"
            >
              <ModeIcon className="me-2 h-4 w-4" />
              {THEME_LABELS[mode]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
