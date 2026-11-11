import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import type { Metadata } from "next";

const tableMeta = TableMetadata.taxonomy;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default async function Taxonomy() {
	return <ExplorePage table="taxonomy" tableConfig={[]} displayMode="grid" toggle />;
}
