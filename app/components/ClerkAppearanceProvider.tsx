"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export default function ClerkAppearanceProvider({ children }: { children: ReactNode }) {
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
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: "#233D7F",
          colorBackground: isDark ? "#141824" : "#F4F3F2",
          colorText: isDark ? "#E2E8F0" : "#2D3748",
        },
        elements: {
          userPreviewMainIdentifier: {
            color: isDark ? "#E2E8F0" : "#2D3748",
          },
          userPreviewSecondaryIdentifier: {
            color: isDark ? "#A0AEC0" : "#4A5568",
          },
        },
      }}
      localization={{
        signIn: {
          start: {
            title: "Sign in uhhhh",
            titleCombined: "Sign in uhhhh"
          }
        },
        dividerText: "or"
      }}
      signInFallbackRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
} 