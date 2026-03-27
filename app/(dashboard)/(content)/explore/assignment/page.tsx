import ExplorePage from "@/app/components/explore/ExplorePage";
import { Metadata } from "next";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";

export const metadata: Metadata = {
	title: "Explore Assignments"
};

const Page = async () => {
	return (
		<ExplorePage table="assignment" tableConfig={[]}>
			<div className="w-full space-y-4">
				<div className="text-base-content/80 space-y-2">
					<p>{TableMetadata.assignment.description}</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="link link-primary link-hover">
							Help page
						</Link>
						.
					</p>
				</div>
				<ExploreTabButtons />
			</div>
		</ExplorePage>
	);
};

export default Page;
