import dynamic from "next/dynamic";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "eDNA 101"
};

// Dynamic import for the DataJourney component to optimize loading
const DataJourney = dynamic(() => import("@/app/components/DataJourney"), {
	ssr: true,
	loading: () => (
		<div className="min-h-100 flex items-center justify-center">
			<div className="animate-pulse text-primary text-xl">Loading Data Journey...</div>
		</div>
	)
});

export default function Edna101Page() {
	return (
		<div id="panel-edna101">
			<DataJourney />
		</div>
	);
}
