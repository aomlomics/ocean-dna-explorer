import ExplorePage from "@/app/components/explore/ExplorePage";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Explore Occurrences"
};

const Page = async () => {
	return <ExplorePage table="occurrence" tableConfig={[]} />;
};

export default Page;
