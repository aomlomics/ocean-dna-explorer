import type { ReactNode } from "react";

export default function TourLayout({ children }: { children: ReactNode }) {
	return (
		<div className="tour-layout-root relative w-full min-h-dvh overflow-x-hidden">
			<style>
				{`
					body:has(.tour-layout-root) header.navbar,
					body:has(.tour-layout-root) footer.footer {
						display: none;
					}

					body:has(.tour-layout-root) #main-content,
					body:has(.tour-layout-root) main:has(> .tour-layout-root),
					body:has(.tour-layout-root) div:has(> .tour-layout-root) {
						width: 100%;
						max-width: none;
						margin: 0;
					}
				`}
			</style>
			{children}
		</div>
	);
}
