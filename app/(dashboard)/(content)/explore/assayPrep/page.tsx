import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import type { Metadata } from "next";

const tableMeta = TableMetadata.assayPrep;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default function AssayPrep() {
	return <ExplorePage table="assayPrep" tableConfig={[]} />;
}
