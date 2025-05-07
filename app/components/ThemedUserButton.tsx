"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemedUserButton() {
  const { theme, resolvedTheme } = useTheme();
  const [forceUpdate, setForceUpdate] = useState(0);
  const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  // Force re-render when theme changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [theme, resolvedTheme]);

  return (
    <UserButton
      key={`user-button-${forceUpdate}`}
      appearance={{
        baseTheme: isDark ? dark : undefined,
        elements: {
          userButtonPopoverCard: {
            backgroundColor: isDark ? "#141824" : "#F4F3F2",
            color: isDark ? "#E2E8F0" : "#2D3748",
          },
          userButtonPopoverActionButton: {
            color: isDark ? "#E2E8F0" : "#2D3748",
            "&:hover": {
              backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
            },
          },
          userButtonPopoverFooter: {
            backgroundColor: isDark ? "#141824" : "#F4F3F2",
            borderTop: `1px solid ${isDark ? "#2D3748" : "#E2E8F0"}`,
          },
          userButtonPopoverActionButtonIcon: {
            color: isDark ? "#E2E8F0" : "#2D3748",
          },
        },
      }}
    />
  );
} 