import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";
import DataDisplay from "@/app/components/DataDisplay";
import { StatIcon, AssayIcon } from "@/app/components/explore/StatCards";
import { Library } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";

export default async function Lib_id({ params }: { params: Promise<{ lib_id: Library["lib_id"] }> }) {
	let { lib_id } = await params;
	lib_id = decodeURIComponent(lib_id);

	const library = await prisma.library.findUnique({
		where: {
			lib_id
		},
		include: {
			Project: {
				select: {
					project_id: true,
					project_name: true,
					isPrivate: true
				}
			},
			Sample: {
				select: {
					samp_name: true,
					project_id: true
				}
			},
			Assay: {
				select: {
					assay_name: true,
					target_gene: true
				}
			},
			AssayPrep: {
				select: {
					project_id: true,
					assay_name: true,
					assay_type: true
				}
			}
		}
	});

	if (!library) return <>Library not found</>;

	const { Project: project, Sample: sample, Assay: assay, AssayPrep: assayPrep, ...justLibrary } = library;

	return (
		<div className="space-y-8 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/library" className="text-primary hover:text-primary-focus">
							Libraries
						</Link>
					</li>
					<li>{library.lib_id}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right"
						data-tip={TableMetadata.library.description}
					>
						{library.lib_id}
					</h1>
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">
					This library connects{" "}
					{sample ? (
						<Link
							href={`/explore/sample/${encodeURIComponent(sample.samp_name)}`}
							className="text-primary hover:text-primary-focus break-all"
						>
							sample {sample.samp_name}
						</Link>
					) : (
						<span className="italic">an unspecified sample</span>
					)}{" "}
					with{" "}
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
					{/* Library metadata table */}
					<div className="lg:col-span-2">
						<div className="bg-base-200 rounded-xl p-6 h-full flex flex-col">
							<h2 className="text-xl font-medium text-base-content/90 mb-4">Library metadata</h2>
							<div className="h-80 overflow-y-auto">
								<DataDisplay
									table="library"
									data={justLibrary}
									omit={["project_id", "samp_name", "assay_name"]}
									priorityFields={[
										"seq_run_id",
										"platform",
										"instrument",
										"seq_kit",
										"lib_layout",
										"input_read_count",
										"lib_conc",
										"lib_conc_unit",
										"phix_perc"
									]}
								/>
							</div>
						</div>
					</div>

					{/* Context cards */}
					<div className="space-y-4">
						{sample && (
							<Link href={`/explore/sample/${encodeURIComponent(sample.samp_name)}`} className="group block w-2/3">
								<div className="bg-base-200 p-4 rounded-lg hover:bg-base-300 transition-colors flex flex-col items-center text-center max-w-xs mx-auto">
									<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
										<StatIcon icon="location" />
									</div>
									<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
										View sample
									</div>
									<div className="text-base font-semibold text-base-content group-hover:text-primary mt-1 break-all">
										{sample.samp_name}
									</div>
								</div>
							</Link>
						)}

						{assay && (
							<Link href={`/explore/assay/${encodeURIComponent(assay.assay_name)}`} className="group block w-2/3">
								<div className="bg-base-200 p-4 rounded-lg hover:bg-base-300 transition-colors flex flex-col items-center text-center max-w-xs mx-auto">
									<div className="w-18 h-12 mb-2 flex items-center justify-center text-primary">
										<AssayIcon />
									</div>
									<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
										View assay
									</div>
									<div className="text-base font-semibold text-base-content group-hover:text-primary mt-1 break-all">
										{assay.target_gene || assay.assay_name}
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
