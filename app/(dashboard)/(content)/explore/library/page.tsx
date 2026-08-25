import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import { Metadata } from "next";

const tableMeta = TableMetadata.library;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default function Library() {
	return <ExplorePage table="library" tableConfig={[]} />;
}
