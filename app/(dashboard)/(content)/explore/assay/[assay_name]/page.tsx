import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Table from "@/app/components/paginated/Table";
import { Assay } from "@/app/generated/prisma/client";
import Link from "next/link";
import PrimerDiagram from "@/app/components/PrimerDiagram";
import GcDonut from "@/app/components/charts/GcDonut";
import StatCard from "@/app/components/explore/StatCard";
import { AnalysisIcon, LocationIcon } from "@/app/components/icons";
import DropdownCard from "@/app/components/explore/DropdownCard";

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

export default async function Assay_name({ params }: { params: Promise<{ assay_name: Assay["assay_name"] }> }) {
	let { assay_name } = await params;
	assay_name = decodeURIComponent(assay_name);

	const assay = await prisma.assay.findUnique({
		where: {
			assay_name
		},
		include: {
			Libraries: true,
			Analyses: {
				select: {
					analysis_run_name: true,
					Project: {
						select: {
							isPrivate: true
						}
					}
				}
			},
			_count: {
				select: {
					Samples: true
				}
			}
		}
	});

	if (!assay) return <>Assay not found</>;
	const { Libraries: _, Analyses: __, _count: ___, ...justAssay } = assay;
	const isPrivate = assay.Analyses.some((a) => {
		return a.Project.isPrivate;
	});

	const forwardGc = calculateGcContent(assay.pcr_primer_forward);
	const reverseGc = calculateGcContent(assay.pcr_primer_reverse);

	return (
		<div id="assay" className="space-y-8 pb-8">
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
					{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
			</header>

			<section className="mt-2 space-y-8">
				{/* Top layout: Map and Assay at a Glance */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left: Map + primer sections + legend */}
					<div className="lg:col-span-2 space-y-8">
						<Map
							query={() =>
								prisma.sample.findMany({
									where: {
										Assays: {
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
						<section id="primerSection" className="p-6 bg-base-100 rounded-lg border border-base-300">
							<div className="space-y-3">
								<div className="flex flex-wrap items-start justify-between gap-6">
									{/* Left: label + primer name */}
									<div className="min-w-35 space-y-1">
										<p className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Forward Primer</p>
										<h3 className="text-xl font-semibold text-base-content break-all">
											{assay.pcr_primer_name_forward}
										</h3>
									</div>

									{/* Center: sequence + reference */}
									<div className="flex-1 min-w-0 space-y-1">
										<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
										<p className="font-mono text-2xl text-primary break-all">{assay.pcr_primer_forward}</p>
										{assay.pcr_primer_reference_forward && (
											<p className="text-xs">
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

									{/* Right: GC content + length */}
									<div className="flex items-center gap-4">
										<div className="text-center">
											<p className="text-xs font-semibold text-base-content/70 mb-1">GC Content</p>
											<GcDonut percentage={forwardGc} size={64} strokeWidth={8} />
										</div>
										<div>
											<p className="text-xs font-semibold text-base-content/70">Length</p>
											<p className="text-2xl font-semibold text-base-content">{assay.pcr_primer_forward.length}</p>
										</div>
									</div>
								</div>
								<div className="w-full overflow-x-auto flex justify-center">
									<PrimerDiagram
										forwardPrimerSequence={assay.pcr_primer_forward}
										reversePrimerSequence={assay.pcr_primer_reverse}
										primerToDisplay="forward"
										scale={1.1}
										showInfo={false}
									/>
								</div>
							</div>
						</section>

						{/* Reverse Primer Section */}
						<section className="p-6 bg-base-100 rounded-lg border border-base-300">
							<div className="space-y-3">
								<div className="flex flex-wrap items-start justify-between gap-6">
									{/* Left: label + primer name */}
									<div className="min-w-35 space-y-1">
										<p className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Reverse Primer</p>
										<h3 className="text-xl font-semibold text-base-content break-all">
											{assay.pcr_primer_name_reverse}
										</h3>
									</div>

									{/* Center: sequence + reference */}
									<div className="flex-1 min-w-0 space-y-1">
										<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
										<p className="font-mono text-2xl text-primary break-all">{assay.pcr_primer_reverse}</p>
										{assay.pcr_primer_reference_reverse && (
											<p className="text-xs">
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

									{/* Right: GC content + length */}
									<div className="flex items-center gap-4">
										<div className="text-center">
											<p className="text-xs font-semibold text-base-content/70 mb-1">GC Content</p>
											<GcDonut percentage={reverseGc} size={64} strokeWidth={8} />
										</div>
										<div>
											<p className="text-xs font-semibold text-base-content/70">Length</p>
											<p className="text-2xl font-semibold text-base-content">{assay.pcr_primer_reverse.length}</p>
										</div>
									</div>
								</div>
								<div className="w-full overflow-x-auto flex justify-center">
									<PrimerDiagram
										forwardPrimerSequence={assay.pcr_primer_forward}
										reversePrimerSequence={assay.pcr_primer_reverse}
										primerToDisplay="reverse"
										scale={1.1}
										showInfo={false}
									/>
								</div>
							</div>
						</section>

						{/* Legend */}
						<div className="p-4 bg-base-100 rounded-lg border border-base-300">
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
								Straight parallel lines show the DNA strands, read from 5&apos; to 3&apos;. Letters above/below the
								highlighted segment show the actual primer sequence.
							</p>
						</div>
					</div>

					{/* Right: Assay at a Glance + Analysis Information */}
					<div className="flex flex-col h-full space-y-8">
						<div>
							<h2 className="text-2xl font-semibold text-base-content/90">Assay at a Glance</h2>
							<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
								<StatCard
									title="Samples"
									icon={<LocationIcon />}
									value={assay._count.Samples}
									link={`/search?table=occurrence&advanced=[["assay","assay_name","equals","${assay_name}"]]`}
									tooltip="View as Search"
								/>
								<StatCard
									title="Libraries"
									icon={<LocationIcon />}
									value={assay.Libraries.length}
									link={`/search?table=library&advanced=[["assay_name","equals","${assay_name}"]]`}
									tooltip="View as Search"
								/>
								<DropdownCard
									table="analysis"
									items={assay.Analyses}
									icon={<AnalysisIcon />}
									className="sm:col-span-2"
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

				{/* Libraries table*/}
				<div className="mt-8">
					<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Libraries</h2>
					<div className="bg-base-100 border border-base-300 rounded-lg p-6">
						<Table table="library" defaultTake={20} where={{ assay_name }} />
					</div>
				</div>
			</section>
		</div>
	);
}
