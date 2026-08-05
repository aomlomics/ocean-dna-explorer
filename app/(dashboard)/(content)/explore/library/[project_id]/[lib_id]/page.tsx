import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";
import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import { AssayIcon, LocationIcon } from "@/app/components/icons";
import StatCard from "@/app/components/explore/StatCard";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { decodeRouteParams } from "@/app/helpers/utils";
import { notFound } from "next/navigation";

export default async function Lib_id({ params }: { params: Promise<{ project_id: string; lib_id: string }> }) {
	const { project_id, lib_id } = await decodeRouteParams(params);

	const library = await prisma.library.findUnique({
		where: {
			project_id_lib_id: {
				project_id,
				lib_id
			}
		},
		include: {
			Project: {
				select: {
					project_name: true
				}
			},
			Sample: {
				select: {
					samp_name: true
				}
			},
			Assay: {
				select: {
					assay_name: true,
					target_gene: true
				}
			}
		}
	});

	if (!library) notFound();

	const { Project: project, Sample: sample, Assay: assay, ...justLibrary } = library;

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
					<TitleHoverTooltip tooltip={TableMetadata.library.description}>
						<h1 className="text-4xl font-semibold text-primary mb-2">{library.lib_id}</h1>
					</TitleHoverTooltip>
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">
					This library connects{" "}
					<Link
						href={`/explore/sample/${encodeURIComponent(project_id)}/${encodeURIComponent(sample.samp_name)}`}
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
						href={`/explore/project/${encodeURIComponent(project_id)}`}
						className="text-primary hover:text-primary-focus break-all"
					>
						{project_id}
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
							link={`/explore/sample/${encodeURIComponent(project_id)}/${encodeURIComponent(sample.samp_name)}`}
							value={sample.samp_name}
							className="w-2/3"
						/>

						<StatCard
							title="Assay"
							icon={<AssayIcon />}
							link={`/explore/assay/${encodeURIComponent(assay.assay_name)}`}
							value={assay.assay_name}
							className="w-2/3"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
