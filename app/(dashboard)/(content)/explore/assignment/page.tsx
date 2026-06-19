import ExplorePage from "@/app/components/explore/ExplorePage";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Explore Assignments"
};

const Page = async () => {
	return <ExplorePage table="assignment" tableConfig={[]} />;
};

export default Page;
