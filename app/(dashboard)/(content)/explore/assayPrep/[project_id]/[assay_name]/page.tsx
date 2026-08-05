import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";
import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import { ProjectIcon } from "@/app/components/icons";
import AssaysCard from "@/app/components/assay/AssaysCard";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { decodeRouteParams } from "@/app/helpers/utils";
import { notFound } from "next/navigation";

export default async function Project_id_Assay_name({
	params
}: {
	params: Promise<{ project_id: string; assay_name: string }>;
}) {
	const { project_id, assay_name } = await decodeRouteParams(params);

	const assayPrep = await prisma.assayPrep.findUnique({
		where: {
			project_id_assay_name: {
				project_id,
				assay_name
			}
		},
		include: {
			Project: {
				select: {
					project_id: true,
					project_name: true
				}
			},
			Assay: {
				select: {
					assay_name: true,
					target_gene: true
				}
			},
			Libraries: {
				select: {
					lib_id: true
				}
			}
		}
	});

	if (!assayPrep) notFound();

	const { Project: project, Assay: assay, Libraries: libraries, ...justAssayPrep } = assayPrep;

	return (
		<div className="space-y-6 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/assayPrep" className="text-primary hover:text-primary-focus">
							Assay preps
						</Link>
					</li>
					<li>{assayPrep.assay_name}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<TitleHoverTooltip tooltip={TableMetadata.assayPrep.description}>
						<h1 className="text-4xl font-semibold text-primary mb-2">{assayPrep.assay_name}</h1>
					</TitleHoverTooltip>
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">
					Assay preparation for{" "}
					{assay ? (
						<Link
							href={`/explore/assay/${encodeURIComponent(assay.assay_name)}`}
							className="text-primary hover:text-primary-focus break-all"
						>
							assay {assay.assay_name}
						</Link>
					) : (
						<span className="italic">an unspecified assay</span>
					)}{" "}
					in project{" "}
					{project ? (
						<Link
							href={`/explore/project/${encodeURIComponent(project.project_id)}`}
							className="text-primary hover:text-primary-focus break-all"
						>
							{project.project_id}
						</Link>
					) : (
						<span className="italic">not specified</span>
					)}
					.
				</p>
			</header>

			<section className="mt-4 space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
					{/* Assay prep metadata table */}
					<div className="lg:col-span-2">
						<div className="bg-base-200 rounded-xl p-6 h-full flex flex-col">
							<h2 className="text-xl font-medium text-base-content/90 mb-4">Assay prep metadata</h2>
							<div className="h-128 overflow-y-auto">
								<DataDisplay table="assayPrep" data={justAssayPrep} omit={["project_id", "assay_name"]} />
							</div>
						</div>
					</div>

					{/* Context cards */}
					<div className="space-y-4">
						{assay && (
							<AssaysCard
								title="Assay used:"
								assays={[{ assay_name: assay.assay_name, target_gene: assay.target_gene ?? assay.assay_name }]}
							/>
						)}

						{project && (
							<Link href={`/explore/project/${encodeURIComponent(project.project_id)}`} className="group block w-2/3">
								<div className="bg-base-200 p-4 rounded-lg hover:bg-base-300 transition-colors flex flex-col items-center text-center max-w-xs mx-auto">
									<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
										<ProjectIcon />
									</div>
									<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
										View project
									</div>
									<div className="text-base font-semibold text-base-content group-hover:text-primary mt-1 break-all">
										{project.project_id}
									</div>
								</div>
							</Link>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
