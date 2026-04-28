import { ReactNode } from "react";

export default function TourLayout({ children }: { children: ReactNode }) {
	return (
		<div className="tour-layout-root relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen max-w-none min-h-screen">
			{children}
		</div>
	);
}
