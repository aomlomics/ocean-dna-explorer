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
          userPreviewSecondaryIdentifier: {
            color: isDark ? "#7DBAE5" : "#233D7F", // Email and secondary text
          },
          cardActionLink: {
            color: isDark ? "#7DBAE5" : "#233D7F", // "Update profile" link
          },
          profileSectionPrimaryButton: {
            color: isDark ? "#7DBAE5" : "#233D7F", // Profile section primary button
          },
          navbarButtonText: {
            color: isDark ? "#7DBAE5" : "#233D7F", // Navbar button text
          },
          navbarButtonIcon: {
            color: isDark ? "#7DBAE5" : "#233D7F", // Navbar icon color
          },
          activeNavbarButtonIcon: {
            color: isDark ? "#7DBAE5" : "#233D7F", // Active navbar icon color
          },
          connectedAccountPrimaryButton: {
            color: isDark ? "#7DBAE5" : "#233D7F",
          },
          connectedAccountButton: {
            color: isDark ? "#7DBAE5" : "#233D7F",
          },
          card: "shadow-2xl p-10 rounded-2xl border-4",
          logoImage: {
            width: "1000px",
            height: "40px"
          }
        },
      }}
      localization={{
        signIn: {
          start: {
            title: "Sign in to the Ocean DNA Explorer",
            titleCombined: "Sign in to the Ocean DNA Explorer"
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