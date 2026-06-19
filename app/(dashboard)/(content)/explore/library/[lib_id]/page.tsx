import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";
import DataDisplay from "@/app/components/DataDisplay";
import { Library } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { AssayIcon, LocationIcon } from "@/app/components/icons";
import StatCard from "@/app/components/explore/StatCard";

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
					project_name: true
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
		<div className="space-y-6 pb-8">
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
					<Link
						href={`/explore/sample/${encodeURIComponent(sample.samp_name)}`}
						className="text-primary hover:text-primary-focus break-all"
					>
						sample {sample.samp_name}
					</Link>{" "}
					with{" "}
					<Link
						href={`/explore/assay/${encodeURIComponent(assay.assay_name)}`}
						className="text-primary hover:text-primary-focus break-all"
					>
						assay {assay.assay_name}
					</Link>{" "}
					in project{" "}
					<Link
						href={`/explore/project/${encodeURIComponent(project.project_id)}`}
						className="text-primary hover:text-primary-focus break-all"
					>
						{project.project_id}
					</Link>
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
								<DataDisplay table="library" data={justLibrary} omit={["project_id", "samp_name", "assay_name"]} />
							</div>
						</div>
					</div>

					{/* Context cards */}
					<div className="space-y-4 flex flex-col">
						<StatCard
							title="Sample"
							icon={<LocationIcon />}
							link={`/explore/sample/${sample.samp_name}`}
							value={sample.samp_name}
							className="w-2/3"
						/>

						<StatCard
							title="Assay"
							icon={<AssayIcon />}
							link={`/explore/assay/${assay.assay_name}`}
							value={assay.assay_name}
							className="w-2/3"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
