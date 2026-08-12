"use client";

import { UserButton } from "@clerk/nextjs";

export function ThemedUserButton() {
	return (
		<UserButton
			appearance={{
				elements: {
					// Real portal wrapper (see @clerk/shared Elements); old userButtonPopover* keys are ignored
					userButtonPopoverRootBox: {
						zIndex: 2147483647
					},
					userButtonPopoverCard: {
						backgroundColor: "var(--color-base-100)",
						color: "var(--color-base-content)"
					},
					userButtonPopoverFooter: {
						backgroundColor: "var(--color-base-100)",
						borderTop: "1px solid var(--color-base-300)"
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
