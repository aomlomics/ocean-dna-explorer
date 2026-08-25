import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import { Metadata } from "next";

const tableMeta = TableMetadata.occurrence;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default function Occurrence() {
	return <ExplorePage table="occurrence" tableConfig={[]} />;
}
