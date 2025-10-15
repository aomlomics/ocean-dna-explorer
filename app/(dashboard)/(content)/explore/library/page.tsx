import ExplorePage from "@/app/components/explore/ExplorePage";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Link from "next/link";

export default function Library() {
	return (
		<ExplorePage table="library" tableConfig={[]}>
			<div className="w-full space-y-4">
				<div className="text-base-content/80 pb-4 space-y-2">
					<p>
						Encompasses sequencing library molecular preparation details (PCR amplification and indexing), the
						sequencing instrumentation and run parameters, and metadata for the generated DNA sequence files.
					</p>
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
}
