"use client";

import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemedUserButton() {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);

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
				elements: {
					// Keep the user menu popover above any header/tab dropdown stacking contexts
					userButtonPopover: {
						zIndex: 1000000
					},
					userButtonPopoverMain: {
						zIndex: 1000000
					},
					userButtonPopoverActions: {
						zIndex: 1000000
					},
					userButtonPopoverCard: {
						backgroundColor: "var(--color-base-100)",
						color: "var(--color-base-content)",
						position: "relative",
						zIndex: 1000000
					},
					userButtonPopoverFooter: {
						backgroundColor: "var(--color-base-100)",
						borderTop: "1px solid var(--color-base-300)",
						position: "relative",
						zIndex: 1000000
					},
					userButtonOuterIdentifier: {
						color: "var(--color-primary)"
					},
					userButtonTrigger: {
						backgroundColor: "var(--color-base-100)",
						color: "var(--color-base-content)"
					}
					// userButtonPopoverCustomItemButton: {
					//   backgroundColor: isDark ? "#7DBAE5" : "#233D7F",
					// }
				}
			}}
		>
			<UserButton.MenuItems>
				<UserButton.Link
					href="/mySubmissions"
					label="My submissions"
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
