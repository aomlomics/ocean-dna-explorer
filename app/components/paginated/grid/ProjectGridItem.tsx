import { Project } from "@/app/generated/prisma/client";
import Link from "next/link";
import Image from "next/image";
import { ProjectIcon } from "@/app/components/icons";
import { exploreUrl } from "@/types/tableMetadata";

type ProjectWithAssays = Project & {
	AssayPreps?: { assay_name: string }[];
};

function getAssayLabel(item: ProjectWithAssays) {
	const assayNames = [...new Set((item.AssayPreps ?? []).map((ap) => ap.assay_name).filter(Boolean))];
	const labelPrefix = assayNames.length === 1 ? "Assay: " : "Assays: ";
	if (!assayNames.length) return `${labelPrefix}No assay name listed`;
	const shownAssays = assayNames.slice(0, 4);
	const moreCount = assayNames.length - shownAssays.length;
	const assaysText = moreCount > 0 ? `${shownAssays.join(", ")} +${moreCount} more` : shownAssays.join(", ");
	return `${labelPrefix}${assaysText}`;
}

export default function ProjectGridItem({ item }: { item: ProjectWithAssays }) {
	const projectName = item.project_name || "No project name listed";
	const assayLabel = getAssayLabel(item);

	return (
		<Link
			href={exploreUrl({ table: "project", project_id: item.project_id })}
			key={item.project_id}
			className="card overflow-hidden bg-base-200 transition-colors duration-200 hover:bg-base-300"
		>
			<div className="card-body gap-0 p-0">
				<div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-base-300/40">
					{item.imageFileUrl_ODE ? (
						<Image
							src={item.imageFileUrl_ODE}
							alt={`Cover image for the ${item.project_id} project.`}
							fill
							sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
							className="object-cover"
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-base-content/60">
							<ProjectIcon className="h-12 w-12 text-primary" />
							<span>No image available</span>
						</div>
					)}
				</div>

				<div className="space-y-1.5 p-3 lg:p-4">
					<p className="wrap-break-word text-lg font-semibold leading-tight text-primary">{item.project_id}</p>
					<p className="wrap-break-word text-sm leading-snug text-base-content/75">{projectName}</p>
					<p className="wrap-break-word text-xs text-base-content/75">{assayLabel}</p>
				</div>
			</div>
		</Link>
	);
}
