import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Table from "@/app/components/paginated/Table";
import { Assay } from "@/app/generated/prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import PrimerDiagram from "@/app/components/PrimerDiagram";
import GcDonut from "@/app/components/charts/GcDonut";
import StatCard from "@/app/components/explore/StatCard";
import { AnalysisIcon, DnaIcon, FishIcon, LocationIcon } from "@/app/components/icons";
import DropdownCard from "@/app/components/explore/DropdownCard";

const ASSAY_MASTER_TSV_URL =
	"https://raw.githubusercontent.com/NOAA-Omics/noaa-omics-metabarcoding-assays/refs/heads/main/assays.tsv";
const dataExplorerTabBase =
	"inline-flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm font-medium transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-[0.9375rem]";

// Simple GC% calculator for summary cards
const calculateGcContent = (seq: string) => {
	if (!seq || seq.length === 0) return 0;
	let gcCount = 0;
	let totalBases = seq.length;
	for (const base of seq.toUpperCase()) {
		switch (base) {
			case "G":
			case "C":
			case "S":
				gcCount += 1;
				break;
			case "V":
			case "B":
				gcCount += 2 / 3;
				break;
			case "R":
			case "Y":
			case "M":
			case "K":
				gcCount += 0.5;
				break;
			case "D":
			case "H":
				gcCount += 1 / 3;
				break;
			case "N":
				totalBases--;
				break;
		}
	}
	if (totalBases === 0) return 0;
	return (gcCount / totalBases) * 100;
};

export default async function Assay_name({
	params,
	searchParams
}: {
	params: Promise<{ assay_name: Assay["assay_name"] }>;
	searchParams: Promise<{ view?: string | string[] }>;
}) {
	const { assay_name } = await params;

	const { view } = await searchParams;
	if (view !== undefined) {
		redirect(`/explore/assay/${encodeURIComponent(assay_name)}`);
	}

	const assay = await prisma.assay.findUnique({
		where: {
			assay_name
		},
		include: {
			Libraries: true,
			Analyses: {
				select: {
					analysis_run_name: true
				}
			}
		}
	});

	if (!assay) return <>Assay not found</>;
	const { Libraries: _, Analyses: __, ...justAssay } = assay;

	const forwardGc = calculateGcContent(assay.pcr_primer_forward);
	const reverseGc = calculateGcContent(assay.pcr_primer_reverse);

	return (
		<div id="assay" className="space-y-6 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/assay" className="text-primary hover:text-primary-focus">
							Assays
						</Link>
					</li>
					<li>{assay_name}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1 className="text-4xl font-semibold text-primary mb-2">{assay_name}</h1>
				</div>
				<div className="mt-1 w-full min-w-0 max-w-full text-sm text-base-content/80 space-y-1">
					<div className="flex flex-wrap gap-x-6 gap-y-1">
						<div>
							<span className="font-medium text-base-content/70">Target: </span>
							<span>{assay.target || "N/A"}</span>
						</div>
						<div>
							<span className="font-medium text-base-content/70">Target Gene: </span>
							<span>{assay.target_gene || "N/A"}</span>
						</div>
						<div>
							<span className="font-medium text-base-content/70">AOML Omics Master Assay </span>
							<Link href={ASSAY_MASTER_TSV_URL} target="_blank" rel="noopener noreferrer" className="link link-primary">
								list
							</Link>
						</div>
					</div>
				</div>
			</header>

			<section className="mt-2 space-y-8">
				{/* Top layout: Map and Assay at a Glance */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left: Map + primer sections + legend */}
					<div className="lg:col-span-2">
						<Map
							query={() =>
								prisma.sample.findMany({
									where: {
										Libraries: {
											some: {
												assay_name
											}
										}
									}
								})
							}
							where={{ assay_name }}
							cluster
							legend
						/>

						{/* Forward Primer Section */}
						<section id="primerSection" className="pt-8">
							<div className="bg-base-200 rounded-xl border border-base-300 p-5 sm:p-6 space-y-6">
								<div className="flex items-start justify-between gap-4">
									<div>
										<h3 className="text-xl font-semibold text-base-content/90">Primer Design</h3>
										<p className="text-sm text-base-content/70">Forward and reverse primer profiles</p>
									</div>
									<button className="btn btn-ghost btn-sm btn-circle text-base-content/60" aria-label="Primer options">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<circle cx="5" cy="12" r="2.1" />
											<circle cx="12" cy="12" r="2.1" />
											<circle cx="19" cy="12" r="2.1" />
										</svg>
									</button>
								</div>

								<div className="space-y-4">
									<div className="rounded-xl p-4 sm:p-5">
										<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
											{/* Left: label + primer name */}
											<div className="lg:col-span-4 min-w-0 space-y-3">
												<p className="text-xs font-medium text-base-content/70 uppercase tracking-wide">
													Forward Primer
												</p>
												<h3 className="text-2xl font-semibold text-base-content break-all">
													{assay.pcr_primer_name_forward}
												</h3>
												<div className="flex items-end gap-6">
													<div className="flex flex-col items-center">
														<p className="text-xs font-semibold text-base-content/70 mb-1">GC Content</p>
														<GcDonut percentage={forwardGc} size={68} strokeWidth={8} />
													</div>
													<div className="flex flex-col items-center">
														<p className="text-xs font-semibold text-base-content/70 mb-1">Length</p>
														<p className="text-[2.25rem] leading-none font-semibold text-base-content">
															{assay.pcr_primer_forward.length}
														</p>
														<p className="text-xs text-base-content/60">bp</p>
													</div>
												</div>
											</div>

											{/* Center: sequence + reference */}
											<div className="lg:col-span-8 min-w-0 space-y-3">
												<div>
													<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
													<p className="font-mono text-xl text-primary break-all">{assay.pcr_primer_forward}</p>
													{assay.pcr_primer_reference_forward && (
														<p className="text-xs mt-1">
															<a
																href={assay.pcr_primer_reference_forward}
																target="_blank"
																rel="noopener noreferrer"
																className="link link-primary"
															>
																View Reference
															</a>
														</p>
													)}
												</div>
												<div className="w-full overflow-x-auto flex justify-start lg:justify-center rounded-lg p-2">
													<PrimerDiagram
														forwardPrimerSequence={assay.pcr_primer_forward}
														reversePrimerSequence={assay.pcr_primer_reverse}
														primerToDisplay="forward"
														scale={1.1}
														showInfo={false}
													/>
												</div>
											</div>
										</div>
									</div>

									{/* Reverse Primer Section */}
									<div className="rounded-xl p-4 sm:p-5">
										<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
											{/* Left: label + primer name */}
											<div className="lg:col-span-4 min-w-0 space-y-3">
												<p className="text-xs font-medium text-base-content/70 uppercase tracking-wide">
													Reverse Primer
												</p>
												<h3 className="text-2xl font-semibold text-base-content break-all">
													{assay.pcr_primer_name_reverse}
												</h3>
												<div className="flex items-end gap-6">
													<div className="flex flex-col items-center">
														<p className="text-xs font-semibold text-base-content/70 mb-1">GC Content</p>
														<GcDonut percentage={reverseGc} size={68} strokeWidth={8} />
													</div>
													<div className="flex flex-col items-center">
														<p className="text-xs font-semibold text-base-content/70 mb-1">Length</p>
														<p className="text-[2.25rem] leading-none font-semibold text-base-content">
															{assay.pcr_primer_reverse.length}
														</p>
														<p className="text-xs text-base-content/60">bp</p>
													</div>
												</div>
											</div>

											{/* Center: sequence + reference */}
											<div className="lg:col-span-8 min-w-0 space-y-3">
												<div>
													<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
													<p className="font-mono text-xl text-primary break-all">{assay.pcr_primer_reverse}</p>
													{assay.pcr_primer_reference_reverse && (
														<p className="text-xs mt-1">
															<a
																href={assay.pcr_primer_reference_reverse}
																target="_blank"
																rel="noopener noreferrer"
																className="link link-primary"
															>
																View Reference
															</a>
														</p>
													)}
												</div>
												<div className="w-full overflow-x-auto flex justify-start lg:justify-center rounded-lg p-2">
													<PrimerDiagram
														forwardPrimerSequence={assay.pcr_primer_forward}
														reversePrimerSequence={assay.pcr_primer_reverse}
														primerToDisplay="reverse"
														scale={1.1}
														showInfo={false}
													/>
												</div>
											</div>
										</div>
									</div>

									{/* Legend */}
									<div className="p-4 rounded-xl">
										<h4 className="text-base-content font-semibold mb-2">Legend</h4>
										<div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 text-sm">
											<div className="flex items-center gap-2">
												<div className="w-4 h-2 bg-primary rounded"></div>
												<span>Primer segment</span>
											</div>
											<div className="flex items-center gap-2">
												<div className="w-4 h-2 bg-base-content/40 rounded"></div>
												<span>Template/complementary strand</span>
											</div>
										</div>
										<p className="text-sm text-base-content/80 mt-2">
											Straight parallel lines show the DNA strands, read from 5&apos; to 3&apos;. Letters above/below
											the highlighted segment show the actual primer sequence.
										</p>
									</div>
								</div>
							</div>
						</section>
					</div>

					{/* Right: Assay at a Glance + Analysis Information */}
					<div className="flex flex-col h-full space-y-8">
						<div>
							<h2 className="text-2xl font-semibold text-base-content/90">Assay at a Glance</h2>
							<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
								<StatCard
									title="Samples"
									icon={<LocationIcon />}
									value={new Set(assay.Libraries.map((lib) => lib.samp_name)).size}
									link={`/search?table=sample&advanced=[["assay","assay_name","equals","${encodeURIComponent(assay_name)}"]]`}
									tooltip="View as Search"
								/>
								<StatCard
									title="Libraries"
									icon={<LocationIcon />}
									value={assay.Libraries.length}
									link={`/search?table=library&advanced=[["assay_name","equals","${encodeURIComponent(assay_name)}"]]`}
									tooltip="View as Search"
								/>
								<StatCard
									title="Taxonomies"
									query={async () =>
										await prisma.taxonomy.count({
											where: {
												Assignments: {
													some: {
														Analysis: {
															assay_name
														},
														Occurrences: {
															some: {
																Library: {
																	assay_name
																}
															}
														}
													}
												}
											}
										})
									}
									icon={<FishIcon />}
									link={`/search?table=taxonomy&advanced=[["analysis","assay_name","equals","${encodeURIComponent(assay_name)}"]]`}
									tooltip="View as Search"
								/>
								<StatCard
									title="Target Gene"
									value={assay.target_gene || "No target_gene provided"}
									icon={<DnaIcon className="w-10 h-10" />}
								/>
								<DropdownCard
									table="analysis"
									items={assay.Analyses}
									icon={<AnalysisIcon />}
									className="sm:col-span-2 w-full"
								/>
							</div>
						</div>

						<div className="bg-base-200 rounded-xl p-6">
							<h2 className="text-xl font-medium text-base-content/90 mb-4">Assay Information</h2>
							<div className="max-h-100 overflow-y-auto">
								<DataDisplay table="assay" data={justAssay} omit={["assay_name"]} />
							</div>
						</div>
					</div>
				</div>

				{/* Data Explorer */}
				<div className="mt-12">
					<h2 className="text-2xl font-semibold text-base-content/90 mb-3 mt-1">Data Explorer</h2>
					<div role="tablist" aria-label="Assay data views" className="tabs bg-transparent gap-2 flex-wrap p-0">
						<input
							type="radio"
							name="assayDataTabs"
							role="tab"
							defaultChecked
							className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
							aria-label="Libraries"
						/>
						<div role="tabpanel" className="tab-content w-full mt-2">
							<Table table="library" defaultTake={20} where={{ assay_name }} />
						</div>

						<input
							type="radio"
							name="assayDataTabs"
							role="tab"
							className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
							aria-label="Analyses"
						/>
						<div role="tabpanel" className="tab-content w-full mt-2">
							<Table table="analysis" defaultTake={20} where={{ assay_name }} />
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
