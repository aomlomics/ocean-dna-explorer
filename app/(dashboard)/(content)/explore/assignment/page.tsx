import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import type { Metadata } from "next";

const tableMeta = TableMetadata.assignment;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default function Assignment() {
	return <ExplorePage table="assignment" tableConfig={[]} />;
}
