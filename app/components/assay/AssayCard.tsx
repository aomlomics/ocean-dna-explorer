import Link from "next/link";
import { Suspense } from "react";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import { exploreAssayUrl } from "@/app/helpers/utils";

interface AssayCardProps {
	assay_name: string;
	target_gene: string;
	className?: string;
}

export default function AssayCard({ assay_name, target_gene, className = "" }: AssayCardProps) {
	return (
		<Link
			href={exploreAssayUrl(assay_name)}
			className={[
				"flex items-center gap-4 p-4 hover:bg-base-300/30 cursor-pointer transition-colors duration-150 group",
				className
			].join(" ")}
		>
			<div className="w-16 h-16 shrink-0 rounded-lg bg-linear-to-br from-base-200 to-base-300 group-hover:from-base-300 group-hover:to-base-200 flex items-center justify-center shadow-sm overflow-hidden transition-colors duration-150">
				<div className="relative w-12 h-12 flex items-center justify-center">
					<Suspense fallback={<span className="loading loading-spinner loading-md text-primary" />}>
						<AssayPhyloPic assay_name={assay_name} />
					</Suspense>
				</div>
			</div>
			<div className="flex-1">
				<h3 className="font-medium text-lg text-base-content">{target_gene}</h3>
				<p className="text-base-content/70">{assay_name}</p>
			</div>
			{/* Chevron indicates the card is a navigation link */}
			<svg
				className="w-4 h-4 text-base-content/45 group-hover:text-base-content/75 transition-colors duration-150 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</Link>
	);
}
