import DisableTrustedMode from "@/app/components/explore/DisableTrustedMode";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { prisma, trustedPrisma } from "@/app/helpers/prisma";
import { decodeRouteParams, exploreUrl } from "@/app/helpers/utils";
import TableMetadata from "@/types/tableMetadata";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
	params
}: {
	params: Promise<{
		project_id: string;
		analysis_run_name: string;
		taxonomy: string;
	}>;
}): Promise<Metadata> {
	const { project_id, analysis_run_name, taxonomy } = await decodeRouteParams(params);

	const hierarchy = await prisma.taxonomicHierarchy.findUnique({
		where: {
			project_id_analysis_run_name_taxonomy: {
				project_id,
				analysis_run_name,
				taxonomy
			}
		},
		select: {
			id: true
		}
	});

	if (hierarchy) {
		return {
			title: `TODO: fill this in | ${TableMetadata.taxonomicHierarchy.plural}`
		};
	} else {
		return {
			title: "TaxonomicHierarchy not found"
		};
	}
}

export default async function Project_id_Analysis_run_name_Taxonomy({
	params,
	searchParams
}: {
	params: Promise<{ project_id: string; analysis_run_name: string; taxonomy: string }>;
	searchParams: Promise<{ view?: string | string[] }>;
}) {
	const { project_id, analysis_run_name, taxonomy } = await decodeRouteParams(params);

	const trustedCheck = await prisma.taxonomicHierarchy.findUnique({
		where: {
			project_id_analysis_run_name_taxonomy: {
				project_id,
				analysis_run_name,
				taxonomy
			}
		},
		select: {
			Analysis: {
				select: {
					trusted: true
				}
			}
		}
	});

	if (!trustedCheck) notFound();

	const cookieStore = await cookies();
	if (!trustedCheck.Analysis.trusted && cookieStore.get("trusted")?.value !== "false") {
		return <DisableTrustedMode />;
	}

	const hierarchy = (await trustedPrisma.taxonomicHierarchy.findUnique({
		where: {
			project_id_analysis_run_name_taxonomy: {
				project_id,
				analysis_run_name,
				taxonomy
			}
		}
	}))!;

	return (
		<div className="space-y-6 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>
						<Link href={exploreUrl({ table: "project", project_id })} className="text-primary hover:text-primary-focus">
							{project_id}
						</Link>
					</li>
					<li>
						<Link href="/explore/analysis" className="text-primary hover:text-primary-focus">
							Analyses
						</Link>
					</li>
					<li>
						<Link
							href={exploreUrl({ table: "analysis", project_id, analysis_run_name })}
							className="text-primary hover:text-primary-focus"
						>
							{analysis_run_name}
						</Link>
					</li>
					<li>
						<Link href="/explore/taxonomy" className="text-primary hover:text-primary-focus">
							Taxonomies
						</Link>
					</li>
					<li>
						<Link href={exploreUrl({ table: "taxonomy", taxonomy })} className="text-primary hover:text-primary-focus">
							{taxonomy}
						</Link>
					</li>
					<li>
						<Link href="/explore/taxonomicHierarchy" className="text-primary hover:text-primary-focus">
							Taxonomic Hierarchies
						</Link>
					</li>
					<li>Taxonomic Hierarchy</li>
				</ul>
			</div>

			<header>
				<div className="flex items-center mb-2 flex-col gap-1 lg:flex-row lg:gap-5">
					<TitleHoverTooltip tooltip={TableMetadata.assignment.description}>
						<h1 className="flex items-center gap-2 text-4xl font-semibold text-primary">
							TODO: TaxonomicHierarchyIcon Assignment
						</h1>
					</TitleHoverTooltip>
				</div>
			</header>

			<span>
				{project_id} {analysis_run_name} {taxonomy}
			</span>
		</div>
	);
}
