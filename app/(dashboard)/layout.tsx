import Footer from "@/app/components/Footer";
import Header from "@/app/components/header/Header";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col min-h-screen">
			<button id="unfocusButton" className="w-0 h-0"></button>
			<Header />
			{children}
			<Footer />
		</div>
	);
}
