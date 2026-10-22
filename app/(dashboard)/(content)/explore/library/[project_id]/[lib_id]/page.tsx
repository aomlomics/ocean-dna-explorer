import Link from "next/link";
import TableMetadata from "@/types/tableMetadata";
import { exploreUrl } from "@/app/helpers/utils";
import DataDisplay from "@/app/components/explore/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import { LibraryIcon, AssayIcon, SampleIcon } from "@/app/components/icons";
import StatCard from "@/app/components/explore/StatCard";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { decodeRouteParams } from "@/app/helpers/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import UntrustedInTrustedMode from "@/app/components/explore/UntrustedInTrustedMode";

export async function generateMetadata({
	params
}: {
	params: Promise<{ project_id: string; lib_id: string }>;
}): Promise<Metadata> {
	const { project_id, lib_id } = await decodeRouteParams(params);

	const library = await prisma.library.findUnique({
		where: {
			project_id_lib_id: {
				project_id,
				lib_id
			}
		},
		select: {
			id: true
		}
	});

	if (library) {
		return {
			title: `${lib_id} | ${TableMetadata.library.plural}`
		};
	} else {
		return {
			title: "Library not found"
		};
	}
}

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
			},
			_count: {
				select: {
					Analyses: {
						where: {
							trusted: true
						}
					}
				}
			}
		}
	});

	if (!library) notFound();

	const { Sample, Assay, _count, ...justLibrary } = library;

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
				<div className="flex items-center mb-2 flex-col gap-1 lg:flex-row lg:gap-5">
					<TitleHoverTooltip tooltip={TableMetadata.library.description}>
						<h1 className="flex items-center gap-2 text-4xl font-semibold text-primary">
							<LibraryIcon className="size-8! shrink-0" />
							<span className="min-w-0 wrap-anywhere">{library.lib_id}</span>
						</h1>
					</TitleHoverTooltip>

					<UntrustedInTrustedMode trusted={!!_count.Analyses} />
				</div>

				<p className="text-lg text-base-content/70 max-w-4xl">
					This library connects{" "}
					<Link
						href={exploreUrl({ table: "sample", project_id, samp_name: Sample.samp_name })}
						className="text-primary hover:text-primary-focus break-all"
					>
						sample {Sample.samp_name}
					</Link>{" "}
					with{" "}
					<Link
						href={exploreUrl({ table: "assay", assay_name: Assay.assay_name })}
						className="text-primary hover:text-primary-focus break-all"
					>
						assay {Assay.assay_name}
					</Link>{" "}
					in project{" "}
					<Link
						href={exploreUrl({ table: "project", project_id })}
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
							icon={<SampleIcon />}
							link={exploreUrl({ table: "sample", project_id, samp_name: Sample.samp_name })}
							value={Sample.samp_name}
							className="w-2/3"
						/>

						<StatCard
							title="Assay"
							icon={<AssayIcon />}
							link={exploreUrl({ table: "assay", assay_name: Assay.assay_name })}
							value={Assay.assay_name}
							className="w-2/3"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
