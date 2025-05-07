"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemedUserButton() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <UserButton
      key={`${theme}-${mounted}`}
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
    >
      <UserButton.MenuItems>
        <UserButton.Link
          href="/mySubmissions"
          label="My Submissions"
          labelIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path strokeWidth="1.5" d="M8 12h8M8 16h8" />
            </svg>
          }
        />
      </UserButton.MenuItems>
    </UserButton>
  );
} 