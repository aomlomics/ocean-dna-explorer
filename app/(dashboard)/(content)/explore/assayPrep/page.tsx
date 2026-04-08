import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import Link from "next/link";

export default function AssayPrep() {
	return (
		<ExplorePage table="assayPrep" tableConfig={[]}>
			<div className="w-full space-y-4">
				<div className="text-base-content/80 space-y-2">
					<p>{TableMetadata.assayPrep.description}</p>
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
}
