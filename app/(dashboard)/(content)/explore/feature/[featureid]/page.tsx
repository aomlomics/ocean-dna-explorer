import TableMetadata from "@/types/tableMetadata";
import { Feature, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { Suspense } from "react";
import Link from "next/link";
import PhyloPic from "@/app/components/images/PhyloPic";
import GcDonut from "@/app/components/charts/GcDonut";
import Table from "@/app/components/paginated/Table";

export default async function Featureid({ params }: { params: Promise<{ featureid: Feature["featureid"] }> }) {
	let { featureid } = await params;
	featureid = decodeURIComponent(featureid);

	const { feature, taxaCounts, assays } = await prisma.$transaction(async (tx) => {
		const feature = await tx.feature.findUnique({
			where: {
				featureid
			},
			include: {
				Assignments: {
					distinct: ["taxonomy"],
					select: {
						taxonomy: true,
						Taxonomy: true
					}
				},
				_count: {
					select: {
						Assignments: true
					}
				},
				Occurrences: {
					where: {
						Analysis: {
							isPrivate: true
						}
					},
					select: {
						id: true
					}
				}
			}
		});

		const taxaCounts = [] as { taxonomy: string; count: number }[];
		if (feature) {
			for (const { taxonomy } of feature.Assignments) {
				taxaCounts.push({
					taxonomy,
					count: await tx.assignment.count({
						where: {
							taxonomy,
							featureid
						}
					})
				});
			}
		}

		const assignmentAssays = await tx.assignment.findMany({
			where: {
				featureid
			},
			select: {
				Analysis: {
					select: {
						assay_name: true
					}
				}
			}
		});
		const assays = [...new Set(assignmentAssays.map((a) => a.Analysis.assay_name))];

		return { feature, taxaCounts, assays };
	});

	if (!feature) return <>Feature not found</>;

	taxaCounts.sort((a, b) => b.count - a.count);
	const primaryTaxonomy = taxaCounts[0]?.taxonomy ?? null;
	const primaryTaxonomyDetails = primaryTaxonomy
		? (feature.Assignments.find((a) => a.taxonomy === primaryTaxonomy)?.Taxonomy as Taxonomy | null)
		: null;
	const primaryTaxonomyName =
		primaryTaxonomyDetails?.species ||
		primaryTaxonomyDetails?.genus ||
		primaryTaxonomyDetails?.taxonomy ||
		primaryTaxonomy ||
		null;
	const totalAssignments = feature._count.Assignments || 0;
	const assignmentLabel = totalAssignments === 1 ? "assignment" : "assignments";
	const isPrivate = !!feature.Occurrences.length;

	return (
		<div className="space-y-8 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/feature" className="text-primary hover:text-primary-focus">
							Features
						</Link>
					</li>
					<li>{feature.featureid}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right"
						data-tip={TableMetadata.feature.description}
					>
						{feature.featureid}
					</h1>
					{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-3xl">
					DNA sequence feature with {totalAssignments.toLocaleString()} {assignmentLabel}.
				</p>
			</header>

			<section className="mt-4 space-y-6">
				{/* DNA sequence on its own row */}
				<div className="space-y-2">
					<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">DNA sequence</p>
					<p className="font-mono text-2xl text-primary break-all">{feature.dna_sequence}</p>
					<div className="flex flex-wrap gap-6 text-sm text-base-content/70 mt-1">
						<span>
							<span className="font-semibold text-base-content">{feature.sequenceLength_ODE}</span> bp
						</span>
						<span>
							<span className="font-semibold text-base-content">{totalAssignments.toLocaleString()}</span>{" "}
							{assignmentLabel}
						</span>
					</div>
				</div>

				{/* Three-column layout: taxonomy, prevalence, assays */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Taxonomy card */}
					<div className="bg-base-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 h-full text-center">
						{primaryTaxonomyDetails ? (
							<>
								<div className="flex flex-col items-center gap-3">
									<div className="w-36 h-36 md:w-40 md:h-40 relative">
										<PhyloPic taxonomy={primaryTaxonomyDetails} />
									</div>
									{primaryTaxonomyDetails.taxonomy ? (
										<Link
											href={`/explore/taxonomy/${encodeURIComponent(primaryTaxonomyDetails.taxonomy)}`}
											className="text-lg font-semibold text-base-content hover:text-primary break-all"
										>
											{primaryTaxonomyName}
										</Link>
									) : (
										<p className="text-lg font-semibold text-base-content break-all">{primaryTaxonomyName}</p>
									)}
								</div>
								<div className="text-xs text-base-content/70 bg-base-200/70 rounded-md p-2 w-full">
									<span className="font-semibold uppercase tracking-wide mr-1">Taxonomy</span>
									<span className="break-all">{primaryTaxonomyDetails.taxonomy ?? primaryTaxonomy}</span>
								</div>
							</>
						) : (
							<p className="text-sm text-base-content/70 text-center">
								No taxonomy assignments are available for this feature yet.
							</p>
						)}
					</div>

					{/* Prevalence graphs (middle column) */}
					<div className="h-full">
						<Suspense
							fallback={
								<div className="bg-base-200 rounded-xl p-4 flex items-center justify-center gap-3 h-full">
									<span className="loading loading-spinner loading-md text-primary" />
									<span className="text-sm text-base-content/70">Loading prevalence…</span>
								</div>
							}
						>
							<div className="bg-base-200 rounded-xl p-4 h-full flex flex-col justify-center">
								<FeaturePrevalenceSection featureid={feature.featureid} />
							</div>
						</Suspense>
					</div>

					{/* Assay dropdown (right column) */}
					<div className="h-full flex items-start">
						<div className="w-3/4">
							<AssayDropdownCard count={assays.length} assayNames={assays} />
						</div>
					</div>
				</div>

				{/* Data tables with toggle */}
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold text-base-content/90">Data Explorer</h2>
					<div role="tablist" className="tabs tabs-lifted">
						<input
							type="radio"
							name="featureDataTabs"
							role="tab"
							className="tab"
							aria-label="Occurrences"
							defaultChecked
						/>
						<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
							<Table table="occurrence" where={{ featureid }} defaultTake={20} />
						</div>

						<input type="radio" name="featureDataTabs" role="tab" className="tab" aria-label="Assignments" />
						<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
							<Table table="assignment" where={{ featureid }} defaultTake={20} />
						</div>
					</div>
				</section>
			</section>
		</div>
	);
}

async function FeaturePrevalenceSection({ featureid }: { featureid: string }) {
	const prevalenceData = await prisma.$transaction(async (tx) => {
		const totalSamplesCount = await tx.sample.count();

		const samplesWithFeature = await tx.sample.findMany({
			where: {
				Libraries: {
					some: {
						Occurrences: {
							some: {
								featureid
							}
						}
					}
				}
			},
			select: {
				samp_name: true,
				project_id: true
			}
		});

		const globalFeatureSamples = samplesWithFeature.length;

		const projectSampleCounts: Record<string, number> = {};
		for (const s of samplesWithFeature) {
			if (!s.project_id) continue;
			projectSampleCounts[s.project_id] = (projectSampleCounts[s.project_id] || 0) + 1;
		}

		const sortedProjects = Object.entries(projectSampleCounts).sort((a, b) => b[1] - a[1]);
		const [primaryProjectId, primaryProjectFeatureSamples] = sortedProjects[0] ?? [null, 0];

		let primaryProjectTotalSamples = 0;
		if (primaryProjectId) {
			primaryProjectTotalSamples = await tx.sample.count({
				where: {
					project_id: primaryProjectId
				}
			});
		}

		return {
			totalSamplesCount,
			globalFeatureSamples,
			primaryProjectId,
			primaryProjectFeatureSamples: typeof primaryProjectFeatureSamples === "number" ? primaryProjectFeatureSamples : 0,
			primaryProjectTotalSamples
		};
	});

	const {
		totalSamplesCount,
		globalFeatureSamples,
		primaryProjectId,
		primaryProjectFeatureSamples,
		primaryProjectTotalSamples
	} = prevalenceData;

	const globalPercent =
		totalSamplesCount && globalFeatureSamples ? (globalFeatureSamples / totalSamplesCount) * 100 : 0;
	const projectPercent =
		primaryProjectId && primaryProjectTotalSamples && primaryProjectFeatureSamples
			? (primaryProjectFeatureSamples / primaryProjectTotalSamples) * 100
			: 0;

	if (!globalFeatureSamples) {
		return (
			<div className="text-sm text-base-content/70">
				This feature has not been observed in any samples yet, so prevalence cannot be calculated.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="bg-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
				<div>
					<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">Across all samples</p>
					<p className="text-3xl font-bold text-primary mt-1">{globalPercent.toFixed(1)}%</p>
					<p className="text-xs text-base-content/70 mt-1">
						{globalFeatureSamples.toLocaleString()} of {totalSamplesCount.toLocaleString()} samples
					</p>
				</div>
				<GcDonut percentage={globalPercent} size={72} strokeWidth={8} />
			</div>

			<div className="bg-base-200 rounded-lg p-4 flex items-center justify-between gap-4">
				<div>
					<p className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
						Within top project
						{primaryProjectId ? (
							<>
								{" "}
								<span className="font-semibold text-base-content">{primaryProjectId}</span>
							</>
						) : null}
					</p>
					<p className="text-3xl font-bold text-primary mt-1">{projectPercent.toFixed(1)}%</p>
					{primaryProjectId ? (
						<p className="text-xs text-base-content/70 mt-1">
							{primaryProjectFeatureSamples.toLocaleString()} of {primaryProjectTotalSamples.toLocaleString()} samples
							in this project
						</p>
					) : (
						<p className="text-xs text-base-content/70 mt-1">
							Not enough information to calculate project-specific prevalence.
						</p>
					)}
				</div>
				<GcDonut percentage={projectPercent} size={72} strokeWidth={8} />
			</div>
		</div>
	);
}

function AssayDropdownCard({ count, assayNames }: { count: number; assayNames: string[] }) {
	return (
		<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300 rounded-lg">
			<div
				tabIndex={0}
				role="button"
				className="focus:bg-base-300 rounded-lg w-full p-4 flex items-center gap-4 justify-between"
			>
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 shrink-0 flex items-center justify-center text-primary">
						<AssayIcon />
					</div>
					<div>
						<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
							<span className="block">Total</span>
							<span className="block">Assays</span>
						</div>
						<div className="text-2xl font-bold text-primary">{count}</div>
					</div>
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-base-content/70"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</div>
			<ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-1 p-2 shadow">
				{assayNames.map((name) => (
					<li key={name}>
						<Link href={`/explore/assay/${name}`} className="text-base-content hover:text-primary break-all">
							{name}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

function AssayIcon() {
	return (
		<svg version="1.1" x="0px" y="0px" viewBox="250 0 550 544" xmlSpace="preserve" className="w-12 h-12">
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M1.000000,441.375000 
C5.402105,443.725037 9.307154,440.363525 13.416513,439.850525 
C18.135319,439.261383 23.017313,443.998077 22.361820,448.751587 
C21.579498,454.424866 21.204031,459.966339 18.636686,465.437531 
C16.900997,469.136353 16.542158,474.282288 20.482365,477.952271 
C21.388285,478.796082 21.309683,479.733734 20.638279,480.607758 
C19.998636,481.440399 18.777445,482.219147 18.129065,481.295685 
C16.168613,478.503601 12.580867,479.346832 10.276000,477.647919 
C10.422181,476.363800 11.315891,476.275665 12.078240,475.991394 
C17.104002,474.117279 18.309349,471.193054 15.745546,466.343475 
C14.467166,463.925293 14.080295,462.283264 16.114256,459.737427 
C18.982323,456.147644 18.393372,451.543945 17.208317,447.297791 
C16.583693,445.059692 14.463182,444.560364 12.390266,444.449371 
C8.904435,444.262787 5.413903,444.164001 1.462674,444.014160 
C1.000000,443.250000 1.000000,442.500000 1.000000,441.375000 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M664.159668,459.296143 
C658.848145,457.771301 654.624695,455.080231 651.071716,451.509491 
C631.216309,431.554657 611.452637,411.508484 591.636353,391.514648 
C588.193909,388.041382 586.552063,384.457672 590.395569,380.227448 
C591.769409,378.715363 591.687744,377.271179 590.221985,375.870117 
C589.861206,375.525238 589.529114,375.149750 589.191895,374.780884 
C580.422668,365.189667 580.454895,365.239471 569.709839,372.113556 
C547.003601,386.639740 522.198975,392.552887 495.400391,389.761078 
C491.858459,389.392120 491.132904,390.511108 491.101501,393.747528 
C490.970642,407.230865 491.640167,420.719025 490.429016,434.198303 
C487.815338,463.286621 467.825165,487.002289 438.246796,494.021484 
C413.263214,499.950287 384.548401,489.787018 368.726776,465.505859 
C361.426636,454.302399 357.630585,442.174866 357.635254,428.790863 
C357.670471,327.989197 357.669861,227.187546 357.676910,126.385895 
C357.677063,124.053574 357.678528,121.719864 357.603546,119.389236 
C357.481598,115.598228 355.922668,113.015350 352.274963,111.186867 
C341.130371,105.600365 336.288971,94.660538 339.297424,82.851578 
C342.167786,71.584900 351.357819,64.681091 363.621552,64.674522 
C405.441467,64.652130 447.261383,64.640068 489.081299,64.659225 
C501.281097,64.664810 511.155029,73.080048 513.215881,85.087120 
C515.281677,97.122757 508.816986,108.363831 497.018250,112.157440 
C492.461334,113.622620 490.958221,116.262550 491.007507,120.559616 
C491.076324,126.555862 491.199371,132.554993 491.080170,138.548523 
C491.012482,141.952606 492.437164,142.869522 495.648682,142.507492 
C519.539001,139.814331 542.229980,144.075073 563.087646,155.911713 
C597.822388,175.623611 618.283264,205.723892 625.303711,244.891052 
C630.979614,276.557220 624.759644,306.091675 608.086914,333.457153 
C606.010315,336.865540 606.367859,339.156799 609.296326,341.565033 
C611.090576,343.040527 612.757141,344.711945 614.276855,346.471680 
C616.839966,349.439789 619.188965,351.597809 623.460266,348.745056 
C626.015259,347.038635 628.578186,348.970795 630.532227,350.935547 
C647.684265,368.181122 664.808594,385.454254 681.953735,402.706665 
C684.418335,405.186707 686.962219,407.587769 689.448730,410.046295 
C699.578979,420.062866 701.922485,432.060760 696.034912,443.700470 
C689.741089,456.143311 678.821167,461.575958 664.159668,459.296143 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M430.298431,170.784393 
C442.867279,159.727341 457.202454,151.853973 473.169830,146.874451 
C475.409790,146.175903 478.957886,146.134613 478.543823,142.773926 
C476.925171,129.635742 482.240387,116.365448 477.690704,103.315720 
C477.604584,103.068726 477.864746,102.700996 478.037628,102.154938 
C481.511261,101.190895 485.187775,101.898621 488.796265,101.637192 
C494.221039,101.244171 498.297882,98.862892 500.619781,93.800713 
C502.673004,89.324295 501.389191,85.320175 498.765106,81.599533 
C495.973206,77.641006 491.857849,76.876266 487.297150,76.859344 
C465.322754,76.777832 443.348999,76.519325 421.374603,76.427780 
C402.881439,76.350739 384.387604,76.385475 365.894257,76.442001 
C361.352020,76.455887 356.757996,76.785240 353.583984,80.683052 
C350.161041,84.886536 349.173645,89.693047 351.442322,94.714699 
C353.782440,99.894554 358.344086,101.629837 363.719482,101.633408 
C387.378876,101.649132 411.038269,101.644806 434.697662,101.653603 
C436.529877,101.654282 438.372650,101.584084 440.192078,101.749519 
C443.904999,102.087120 446.166656,104.276680 446.029144,107.930794 
C445.899231,111.382698 443.504120,113.203133 440.022736,113.358688 
C435.031647,113.581703 430.022369,114.126785 425.049744,113.900314 
C408.243652,113.134918 391.423004,114.602905 374.627441,113.418869 
C371.467529,113.196106 369.242371,113.511230 369.312378,117.810326 
C369.677765,140.255585 369.937653,162.705109 369.935699,185.153122 
C369.933350,212.117889 369.486023,239.082687 369.495575,266.047394 
C369.506592,297.180908 370.186340,328.318481 369.852509,359.446503 
C369.609741,382.088684 370.206024,404.719971 369.922577,427.352478 
C369.777588,438.929138 372.944977,449.427643 379.217285,458.935608 
C392.336212,478.821991 416.914642,487.570892 439.739929,480.785095 
C462.269836,474.087097 478.616608,452.311340 478.705963,428.817871 
C478.752228,416.655090 478.604340,404.489807 478.815826,392.330414 
C478.878632,388.720490 477.677795,386.887695 474.233765,385.826630 
C465.300659,383.074432 456.625092,379.581329 448.608032,374.744629 
C404.052612,347.864319 380.767303,298.434662 388.733612,246.983124 
C393.382477,216.957474 407.108826,191.626694 430.298431,170.784393 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M426.051575,192.541168 
C424.666687,194.204788 423.135101,195.768066 421.918579,197.546844 
C397.585907,233.125488 392.169006,270.952850 408.810669,311.213440 
C427.426575,356.250214 472.237091,383.215179 519.803162,377.527008 
C572.907837,371.176514 610.343628,326.813690 614.558716,275.975647 
C616.878723,247.993713 609.871399,222.090546 593.359253,199.111191 
C574.655029,173.081253 549.480164,157.346039 517.443970,154.541534 
C480.980194,151.349442 450.444183,164.023163 426.051575,192.541168 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M665.969666,446.719513 
C673.375488,448.789490 680.224854,446.277649 684.140564,440.055786 
C688.345337,433.374695 687.823669,425.994232 681.915039,419.956146 
C664.113586,401.764557 646.062744,383.817108 628.208740,365.676422 
C625.653381,363.079956 623.916077,363.530029 621.656982,365.905884 
C616.843750,370.967987 612.057190,376.087585 606.872192,380.752930 
C603.301208,383.965973 603.298157,386.024567 606.777405,389.465179 
C623.567261,406.068726 640.082642,422.949707 656.705139,439.722656 
C659.275208,442.315979 661.684082,445.126556 665.969666,446.719513 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M604.057983,353.439728 
C597.492920,346.924072 595.563721,347.448730 589.487732,357.638611 
C593.491699,361.119812 597.558228,364.655334 601.852478,368.388885 
C602.235596,368.041595 603.374451,367.111664 604.395630,366.066742 
C610.446350,359.875549 611.646423,361.170380 604.057983,353.439728 
z"
			/>
		</svg>
	);
}
