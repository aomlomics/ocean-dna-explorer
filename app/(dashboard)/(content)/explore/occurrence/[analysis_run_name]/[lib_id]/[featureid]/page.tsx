import Map from "@/app/components/map/Map";
import PhyloPic from "@/app/components/images/PhyloPic";
import TableMetadata from "@/types/tableMetadata";
import { Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { AnalysisIcon, LocationIcon } from "@/app/components/icons";
import { TaxonomicRanks } from "@/types/objects";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { DashCardInfoButton } from "@/app/components/dataSummary/DashCard";
import AssaysCard from "@/app/components/assay/AssaysCard";
import { decodeRouteParams } from "@/app/helpers/utils";

function formatTaxonomyDisplay(dbTaxonomy: Taxonomy) {
	const taxonomicData = Object.entries(dbTaxonomy)
		.filter(([key, value]) => {
			return TaxonomicRanks.includes(key as (typeof TaxonomicRanks)[0]) && value;
		})
		.map(([key, value]) => ({
			rank: key.charAt(0).toUpperCase() + key.slice(1),
			name: String(value).replace("_", " ")
		}));

	return (
		<div className="space-y-2">
			{taxonomicData.map((item) => (
				<div key={item.rank}>
					<span className="text-base-content/70 font-semibold text-sm">{item.rank}: </span>
					<span className="text-base-content font-medium text-sm">{item.name}</span>
				</div>
			))}
		</div>
	);
}

function MaskSvgIcon({ src, className }: { src: string; className?: string }) {
	return (
		<span
			aria-hidden="true"
			className={`inline-block h-10 w-10 bg-current ${className ?? ""}`}
			style={{
				WebkitMaskImage: `url('${src}')`,
				maskImage: `url('${src}')`,
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
				WebkitMaskPosition: "center",
				maskPosition: "center",
				WebkitMaskSize: "contain",
				maskSize: "contain"
			}}
		/>
	);
}

export default async function Analysis_run_name_Lib_id_Featureid({
	params
}: {
	params: Promise<{
		analysis_run_name: string;
		lib_id: string;
		featureid: string;
	}>;
}) {
	const { analysis_run_name, lib_id, featureid } = await decodeRouteParams(params);

	const occurrence = await prisma.occurrence.findUnique({
		where: {
			analysis_run_name_lib_id_featureid: {
				analysis_run_name,
				lib_id,
				featureid
			}
		},
		include: {
			Library: {
				select: {
					Sample: true
				}
			},
			Analysis: {
				select: {
					assay_name: true,
					Assay: {
						select: {
							target_gene: true
						}
					}
				}
			},
			Feature: {
				select: {
					dna_sequence: true
				}
			},
			Assignment: {
				select: {
					Taxonomy: true
				}
			}
		}
	});
	if (!occurrence) return <>Occurrence not found</>;

	const occurrenceTitle = `${featureid} in ${lib_id} (${analysis_run_name})`;
	const occurrenceInfo = {
		description:
			"This page shows where a specific feature was observed, the assigned taxonomy, and key sequence context for this single occurrence.",
		links: [{ label: "Browse all occurrences", href: "/explore/occurrence" }]
	};

	const taxonomyName =
		occurrence.Assignment.Taxonomy.species ||
		occurrence.Assignment.Taxonomy.genus ||
		occurrence.Assignment.Taxonomy.taxonomy ||
		"Unknown taxonomy";
	const assayCardTitle =
		occurrence.Analysis.assay_name && occurrence.Analysis.Assay
			? "Assay used in this Occurrence"
			: "Assays used in this Occurrence";

	const topStatCards = (
		<div className="flex flex-wrap gap-4">
			<Link href={`/explore/feature/${encodeURIComponent(featureid)}`} className="block w-max max-w-full">
				<div className="group h-24 rounded-lg bg-base-200 p-4 flex items-center gap-4 hover:bg-base-300 transition-all duration-300 hover:scale-105">
					<div className="text-primary">
						<MaskSvgIcon src="/images/icons/feature_icon.svg" />
					</div>
					<div className="flex min-w-0 flex-col gap-1 overflow-hidden">
						<div className="font-medium text-primary tabular-nums leading-tight text-sm whitespace-nowrap">
							{featureid}
						</div>
						<div className="text-xs font-sans font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
							Feature
						</div>
					</div>
				</div>
			</Link>
			<Link
				href={`/explore/library/${encodeURIComponent(occurrence.project_id)}/${lib_id}`}
				className="block w-max max-w-full"
			>
				<div className="group h-24 rounded-lg bg-base-200 p-4 flex items-center gap-4 hover:bg-base-300 transition-all duration-300 hover:scale-105">
					<div className="text-emerald-300 [html[data-theme='light']_&]:text-emerald-700">
						<MaskSvgIcon src="/images/icons/library_icon.svg" />
					</div>
					<div className="flex min-w-0 flex-col gap-1 overflow-hidden">
						<div className="font-medium text-emerald-300 [html[data-theme='light']_&]:text-emerald-700 tabular-nums leading-tight text-sm whitespace-nowrap">
							{lib_id}
						</div>
						<div className="text-xs font-sans font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
							Library
						</div>
					</div>
				</div>
			</Link>
			<Link href={`/explore/analysis/${encodeURIComponent(analysis_run_name)}`} className="block w-max max-w-full">
				<div className="group h-24 rounded-lg bg-base-200 p-4 flex items-center gap-4 hover:bg-base-300 transition-all duration-300 hover:scale-105">
					<div className="text-amber-300 [html[data-theme='light']_&]:text-amber-700">
						<AnalysisIcon className="h-10 w-10" />
					</div>
					<div className="flex min-w-0 flex-col gap-1 overflow-hidden">
						<div className="font-medium text-amber-300 [html[data-theme='light']_&]:text-amber-700 tabular-nums leading-tight text-sm whitespace-nowrap">
							{analysis_run_name}
						</div>
						<div className="text-xs font-sans font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
							Analysis
						</div>
					</div>
				</div>
			</Link>
		</div>
	);

	return (
		<div className="space-y-8 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-sm breadcrumbs">
				<ul className="flex-nowrap overflow-x-auto whitespace-nowrap pb-1">
					<li>
						<Link href="/explore/analysis" className="text-primary hover:text-primary-focus whitespace-nowrap">
							Analyses
						</Link>
					</li>
					<li>
						<Link
							href={`/explore/analysis/${encodeURIComponent(analysis_run_name)}`}
							className="inline-block max-w-[26ch] truncate align-bottom text-primary hover:text-primary-focus"
							title={analysis_run_name}
						>
							{analysis_run_name}
						</Link>
					</li>
					<li>
						<Link href="/explore/occurrence" className="text-primary hover:text-primary-focus whitespace-nowrap">
							Occurrences
						</Link>
					</li>
					<li>
						<span
							className="inline-block max-w-[32ch] truncate align-bottom text-base-content/75"
							title={occurrenceTitle}
						>
							{occurrenceTitle}
						</span>
					</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<TitleHoverTooltip tooltip={TableMetadata.occurrence.description}>
						<h1 className="mb-2 text-2xl sm:text-3xl font-semibold text-primary wrap-anywhere">
							<span className="text-primary">{featureid}</span>
							<span className="text-base-content/55"> in </span>
							<span className="text-emerald-300 [html[data-theme='light']_&]:text-emerald-700">{lib_id}</span>
							<span className="text-base-content/55"> (</span>
							<span className="text-amber-300 [html[data-theme='light']_&]:text-amber-700">{analysis_run_name}</span>
							<span className="text-base-content/55">)</span>
						</h1>
					</TitleHoverTooltip>
				</div>
				<p className="mb-2 max-w-5xl text-sm text-base-content/65 wrap-anywhere">
					An occurrence links a feature (<span className="font-medium text-primary">featureid</span>), library (
					<span className="font-medium text-emerald-300 [html[data-theme='light']_&]:text-emerald-700">lib_id</span>),
					and analysis (
					<span className="font-medium text-amber-300 [html[data-theme='light']_&]:text-amber-700">
						analysis_run_name
					</span>
					).
				</p>
				<div className="mt-4">{topStatCards}</div>
			</header>

			<section className="mt-2 space-y-8">
				{/* Top layout: map/assay on left and occurrence detail on right */}
				<div className="grid grid-cols-1 lg:grid-cols-8 gap-6 items-start">
					{/* Left: single-sample map and assay */}
					<div className="lg:col-span-3 flex flex-col gap-6">
						<Map locations={[occurrence.Library.Sample]} className="w-full min-h-80 rounded-xl" />
						<AssaysCard
							title={assayCardTitle}
							assays={[
								{ assay_name: occurrence.Analysis.assay_name, target_gene: occurrence.Analysis.Assay.target_gene }
							]}
						/>
					</div>

					{/* Right: occurrence detail and sample link */}
					<div className="lg:col-span-5 flex flex-col gap-6">
						<div
							className={[
								"group rounded-2xl bg-base-200 p-6 flex flex-col",
								"shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-12px_rgba(0,0,0,0.45),0_1px_3px_-1px_rgba(0,0,0,0.18)]",
								"hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_10px_24px_-14px_rgba(0,0,0,0.5),0_2px_5px_-1px_rgba(0,0,0,0.22)]",
								"transition-shadow duration-300"
							].join(" ")}
						>
							<div className="mb-6 flex items-start justify-between gap-4">
								<h2 className="text-base sm:text-lg font-semibold text-base-content/80 transition-colors group-hover:text-white">
									Assigned Taxonomy
								</h2>
								<DashCardInfoButton info={occurrenceInfo} />
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
								{/* Left: taxonomic image, name, and sequence quantity */}
								<div className="flex flex-col items-center justify-center gap-4 text-center">
									{occurrence.Assignment.Taxonomy && (
										<div className="w-32 h-32 md:w-40 md:h-40 relative">
											<PhyloPic taxonomy={occurrence.Assignment.Taxonomy} />
										</div>
									)}
									<div className="space-y-2">
										{occurrence.Assignment.Taxonomy ? (
											<Link
												href={`/explore/taxonomy/${encodeURIComponent(occurrence.Assignment.Taxonomy.taxonomy)}`}
												className="text-base md:text-lg font-semibold text-base-content hover:text-primary wrap-break-word"
											>
												{taxonomyName}
											</Link>
										) : (
											<p className="text-base md:text-lg font-semibold text-base-content">{taxonomyName}</p>
										)}
										<div className="space-y-2 pt-1">
											<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
												Sequence quantity
											</p>
											<p className="text-4xl md:text-5xl font-bold text-primary leading-tight">
												{occurrence.organismQuantity.toLocaleString()}
											</p>
										</div>
									</div>
								</div>

								{/* Right: full taxonomy and DNA sequence */}
								<div className="space-y-4">
									<div className="space-y-2 border-b border-base-content/10 pb-4">
										<p className="text-xs font-semibold text-base-content/65 uppercase tracking-wide">Full taxonomy</p>
										<div className="max-h-40 overflow-y-auto pr-1">
											{occurrence.Assignment.Taxonomy ? (
												formatTaxonomyDisplay(occurrence.Assignment.Taxonomy)
											) : (
												<p className="text-sm text-base-content/70">No taxonomy assignment available.</p>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<p className="text-xs font-semibold text-base-content/65 uppercase tracking-wide">DNA sequence</p>
										<p className="font-mono text-sm md:text-base text-base-content/90 break-all leading-relaxed">
											{occurrence.Feature.dna_sequence}
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className="w-full lg:max-w-sm">
							<Link
								href={`/explore/sample/${encodeURIComponent(occurrence.project_id)}/${encodeURIComponent(occurrence.Library.Sample.samp_name)}`}
								className="group h-24 rounded-lg bg-base-200 p-4 flex items-center gap-4 hover:bg-base-300 transition-all duration-300 hover:scale-105"
							>
								<div className="text-primary">
									<LocationIcon className="h-10 w-10" />
								</div>
								<div className="flex min-w-0 flex-col gap-1 overflow-hidden">
									<div className="truncate font-medium text-base-content tabular-nums leading-tight text-sm">
										{occurrence.Library.Sample.samp_name}
									</div>
									<div className="text-xs font-sans font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
										Sample
									</div>
								</div>
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
