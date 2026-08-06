import { ReactNode } from "react";

export default function TourLayout({ children }: { children: ReactNode }) {
	return (
		<div className="tour-layout-root relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen max-w-none min-h-screen">
			<style>
				{`
					body:has(.tour-layout-root) header.navbar,
					body:has(.tour-layout-root) footer.footer {
						display: none;
					}

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
