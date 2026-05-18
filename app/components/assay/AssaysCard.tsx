import AssayCard from "@/app/components/assay/AssayCard";
import { DashCardInfoButton } from "@/app/components/dataSummary/DashCard";

type AssaySummary = {
	assay_name: string;
	target_gene: string;
};

type AssaysCardProps = {
	title: string;
	assays: AssaySummary[];
	id?: string;
	className?: string;
};

const assayInfo = {
	description:
		"Assays in ODE come from a shared master list that defines accepted assay and target gene information for submissions.",
	links: [
		{
			label: "Assay repository",
			href: "https://github.com/NOAA-Omics/noaa-omics-metabarcoding-assays",
			target: "_blank" as const
		},
		{
			label: "Request an assay",
			href: "https://github.com/NOAA-Omics/noaa-omics-metabarcoding-assays/issues",
			target: "_blank" as const
		}
	]
};

export default function AssaysCard({ title, assays, id, className = "" }: AssaysCardProps) {
	return (
		<div id={id} className={["bg-base-200 rounded-xl p-5", className].join(" ")}>
			<div className="flex items-start justify-between gap-4 mb-4">
				<h2 className="text-2xl font-semibold text-base-content/90">{title}</h2>
				<DashCardInfoButton info={assayInfo} />
			</div>
			{assays.length > 0 ? (
				<div className="divide-y divide-base-content/10">
					{assays.map((assay) => (
						<AssayCard
							key={assay.assay_name}
							assay_name={assay.assay_name}
							target_gene={assay.target_gene}
							className="bg-transparent"
						/>
					))}
				</div>
			) : (
				<p className="text-sm text-base-content/60 italic">No assays listed yet.</p>
			)}
		</div>
	);
}
