import Map from "@/app/components/map/Map";
import PhyloPic from "@/app/components/images/PhyloPic";
import TableMetadata from "@/types/tableMetadata";
import { Occurrence, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { LocationIcon } from "@/app/components/icons";
import { TaxonomicRanks } from "@/types/objects";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { DashCardInfoButton } from "@/app/components/dataSummary/DashCard";

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

export default async function Analysis_run_name_Lib_id_Featureid({
	params
}: {
	params: Promise<{
		analysis_run_name: Occurrence["analysis_run_name"];
		lib_id: Occurrence["lib_id"];
		featureid: Occurrence["featureid"];
	}>;
}) {
	let { analysis_run_name, lib_id, featureid } = await params;
	analysis_run_name = decodeURIComponent(analysis_run_name);
	lib_id = decodeURIComponent(lib_id);
	featureid = decodeURIComponent(featureid);

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
					project_id: true
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
							href={`/explore/analysis/${analysis_run_name}`}
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
						<span className="inline-block max-w-[32ch] truncate align-bottom text-base-content/75" title={occurrenceTitle}>
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
							<span className="text-emerald-300">{lib_id}</span>
							<span className="text-base-content/55"> (</span>
							<span className="text-amber-300">{analysis_run_name}</span>
							<span className="text-base-content/55">)</span>
						</h1>
					</TitleHoverTooltip>
				</div>
				<p className="mb-2 max-w-5xl text-sm text-base-content/65 wrap-anywhere">
					This record links one feature detection to its sample, library, analysis, assay, and assigned taxonomy.
				</p>
				<p className="mb-2 max-w-5xl text-sm text-base-content/65 wrap-anywhere">
					Color key: <span className="font-medium text-primary">feature ID</span>,{" "}
					<span className="font-medium text-emerald-300">library ID</span>,{" "}
					<span className="font-medium text-amber-300">analysis ID</span>.
				</p>
				<div className="max-w-5xl flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70">
					<div className="min-w-0">
						<span className="text-base-content/65">Feature:</span>{" "}
						<Link href={`/explore/feature/${featureid}`} className="link link-primary link-hover wrap-anywhere">
							{featureid}
						</Link>
					</div>
					<div className="min-w-0">
						<span className="text-base-content/65">Sample:</span>{" "}
						<Link
							href={`/explore/sample/${encodeURIComponent(occurrence.Library.Sample.samp_name)}`}
							className="link link-primary link-hover wrap-anywhere"
						>
							{occurrence.Library.Sample.samp_name}
						</Link>
					</div>
					<div className="min-w-0">
						<span className="text-base-content/65">Library:</span>{" "}
						<Link href={`/explore/library/${lib_id}`} className="link link-primary link-hover wrap-anywhere">
							{lib_id}
						</Link>
					</div>
					<div className="min-w-0">
						<span className="text-base-content/65">Analysis:</span>{" "}
						<Link href={`/explore/analysis/${analysis_run_name}`} className="link link-primary link-hover wrap-anywhere">
							{analysis_run_name}
						</Link>
					</div>
					<div className="min-w-0">
						<span className="text-base-content/65">Assay:</span>{" "}
						<Link
							href={`/explore/assay/${occurrence.Analysis.assay_name}`}
							className="link link-primary link-hover wrap-anywhere"
						>
							{occurrence.Analysis.assay_name}
						</Link>
					</div>
				</div>
			</header>

			<section className="mt-2 space-y-8">
				{/* Top layout: map and occurrence details — gap-8 matches space-y-8 below */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
					{/* Left: Single-sample map */}
					<div className="h-full">
						<Map locations={[occurrence.Library.Sample]} className="aspect-square rounded-xl overflow-hidden" />
					</div>

					{/* Right: Featured data */}
					<div className="lg:col-span-2 h-full">
						<div
							className={[
								"group h-full rounded-2xl bg-base-200 p-6 flex flex-col",
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
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-start">
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
					</div>
				</div>

				{/* Same vertical gap as gap-8 between map and detail card; width ≈ one map column (1/3) on lg */}
				<div className="w-full lg:w-1/3 min-w-0">
					<div
						className={[
							"group rounded-xl bg-base-200 p-4",
							"shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-12px_rgba(0,0,0,0.45),0_1px_3px_-1px_rgba(0,0,0,0.18)]",
							"hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_10px_24px_-14px_rgba(0,0,0,0.5),0_2px_5px_-1px_rgba(0,0,0,0.22)]",
							"transition-shadow duration-300"
						].join(" ")}
					>
						<Link
							href={`/explore/sample/${encodeURIComponent(occurrence.Library.Sample.samp_name)}`}
							className="flex items-center gap-4 rounded-lg p-4 hover:bg-base-300/30 transition-colors"
						>
							<div className="h-12 w-12 shrink-0 rounded-lg bg-base-100/30 flex items-center justify-center text-primary">
								<LocationIcon />
							</div>
							<div className="min-w-0">
								<p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Sample</p>
								<p className="text-base font-medium text-base-content wrap-anywhere">
									{occurrence.Library.Sample.samp_name}
								</p>
							</div>
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
