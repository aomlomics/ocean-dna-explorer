import DataJourney from "@/app/components/learn/DataJourney";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "eDNA 101",
	description:
		"Follow eDNA from environmental sampling and laboratory processing to sequencing, bioinformatics, taxonomy, and biological discovery."
};

export default function Edna101Page() {
	return (
		<div id="panel-edna101">
			<DataJourney />
		</div>
	);
}
