import dynamic from "next/dynamic";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Impact"
};

const ImpactLearnPage = dynamic(() => import("@/app/components/ImpactLearnPage"), {
	ssr: true,
	loading: () => (
		<div className="min-h-100 flex items-center justify-center">
			<div className="animate-pulse text-primary text-xl">Loading Impact...</div>
		</div>
	)
});

export default function ImpactPage() {
	return (
		<div id="panel-impact">
			<ImpactLearnPage />
		</div>
	);
}
