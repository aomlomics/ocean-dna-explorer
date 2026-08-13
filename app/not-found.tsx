import Footer from "@/app/components/Footer";
import Header from "@/app/components/header/Header";
import NotFoundScreen from "@/app/components/NotFoundScreen";

export const metadata = {
	title: "Page not found | Ocean DNA Explorer"
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
