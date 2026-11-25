"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { ICON_BUTTON_SIZE, IconButton } from "@/components/ui/IconButton";

const emptySubscribe = () => () => undefined;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <span className={`inline-block ${ICON_BUTTON_SIZE}`} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <IconButton
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </IconButton>
  );
}
