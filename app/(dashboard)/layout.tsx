import Footer from "@/app/components/Footer";
import Header from "@/app/components/header/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col min-h-screen">
			<button id="unfocusButton" className="w-0 h-0"></button>
			<Header />
			{children}
			<Footer />
		</div>
	);
}
