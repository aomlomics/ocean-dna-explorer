import Footer from "@/app/components/Footer";
import Header from "@/app/components/header/Header";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen min-w-0 flex-col">
			<button type="button" id="unfocusButton" tabIndex={-1} aria-hidden className="w-0 h-0"></button>
			<Header />
			{children}
			<Footer />
		</div>
	);
}
