import ExplorePage from "@/app/components/explore/ExplorePage";
import { Metadata } from "next";
import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";

export const metadata: Metadata = {
	title: "Explore Occurrences"
};

const Page = async () => {
	return (
		<ExplorePage table="occurrence" tableConfig={[]}>
			<div className="w-full space-y-4">
				<div className="text-base-content/80 space-y-2">
					<p>{TableMetadata.occurrence.description}</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="link link-primary link-hover">
							Help page
						</Link>
						.
					</p>
				</div>
			</div>
		</ExplorePage>
	);
};

export default Page;
