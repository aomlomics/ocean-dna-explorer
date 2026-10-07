import Footer from "@/app/components/Footer";
import Header from "@/app/components/header/Header";
import NotFoundScreen from "@/app/components/NotFoundScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Page not found"
};

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<NotFoundScreen />
			<Footer />
		</div>
	);
}
