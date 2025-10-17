import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Table from "@/app/components/paginated/Table";
import DropdownLinkBox from "@/app/components/DropdownLinkBox";
import { Assay } from "@/app/generated/prisma/client";
import Link from "next/link";
import PrimerDiagram from "@/app/components/PrimerDiagram";
import GcDonut from "@/app/components/charts/GcDonut";

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
			Samples: {
				include: {
					Project: {
						select: {
							isPrivate: true
						}
					}
				}
			},
			Libraries: true,
			Analyses: {
				select: {
					analysis_run_name: true
				}
			}
		}
	});

	if (!assay) return <>Assay not found</>;
	const { Samples: _, Libraries: __, Analyses: ___, ...justAssay } = assay;
	const isPrivate = assay.Samples.some((samp) => {
		return samp.Project.isPrivate;
	});

	const forwardGc = calculateGcContent(assay.pcr_primer_forward);
	const reverseGc = calculateGcContent(assay.pcr_primer_reverse);

	return (
		<div className="space-y-8">
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

			<div className="grid grid-cols-2 gap-8">
				<div className="col-span-2">
					<header className="flex gap-2 items-center">
						<h1 className="text-4xl font-semibold text-primary mb-2">{assay_name}</h1>
						{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
					</header>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-8">
						<div className="stat bg-base-200 p-6">
							<div className="text-lg font-medium text-base-content/70">Total Samples</div>
							<div className="text-base mt-1">{assay.Samples.length}</div>
						</div>
						<div className="stat bg-base-200 p-6">
							<div className="text-lg font-medium text-base-content/70">Total Libraries</div>
							<div className="text-base mt-1">{assay.Libraries.length}</div>
						</div>
						<DropdownLinkBox
							title="Total Analyses"
							count={assay.Analyses.length}
							content={assay.Analyses.map((a) => a.analysis_run_name)}
							linkPrefix="/explore/analysis"
						/>
					</div>
				</div>

				<div className="bg-base-200 p-6 h-full">
					<div className="text-lg font-medium text-base-content/70">Analysis Information</div>
					<div className="h-[300px] overflow-y-auto mt-4">
						<DataDisplay table="assay" data={justAssay} omit={["assay_name"]} />
					</div>
				</div>
			</div>

			{/* Forward Primer Section */}
			<section className="p-6 bg-base-100 rounded-lg border border-base-300">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
					<div className="space-y-4">
						<div>
							<div>
								<p className="text-sm font-medium text-base-content/70">Forward Primer</p>
								<h3 className="text-2xl font-bold text-primary">{assay.pcr_primer_name_forward}</h3>
							</div>
							<div className="mt-3">
								<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
								<p className="font-mono text-base break-all">{assay.pcr_primer_forward}</p>
							</div>
						</div>
						<div className="space-y-3 pt-1">
							<div className="flex items-center gap-4">
								<div className="text-center">
									<p className="text-xs font-semibold text-base-content/70 mb-1">GC Content</p>
									<GcDonut percentage={forwardGc} size={80} strokeWidth={9} />
								</div>
								<div>
									<p className="text-xs font-semibold text-base-content/70">Length</p>
									<p className="text-3xl font-semibold">{assay.pcr_primer_forward.length}</p>
								</div>
							</div>
							{assay.pcr_primer_reference_forward && (
								<p className="text-sm">
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
					</div>
					<div className="lg:col-span-3">
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
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
					<div className="space-y-4">
						<div>
							<div>
								<p className="text-sm font-medium text-base-content/70">Reverse Primer</p>
								<h3 className="text-2xl font-bold text-primary">{assay.pcr_primer_name_reverse}</h3>
							</div>
							<div className="mt-3">
								<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
								<p className="font-mono text-base break-all">{assay.pcr_primer_reverse}</p>
							</div>
						</div>
						<div className="space-y-3 pt-1">
							<div className="flex items-center gap-4">
								<div className="text-center">
									<p className="text-xs font-semibold text-base-content/70 mb-1">GC Content</p>
									<GcDonut percentage={reverseGc} size={80} strokeWidth={9} />
								</div>
								<div>
									<p className="text-xs font-semibold text-base-content/70">Length</p>
									<p className="text-3xl font-semibold">{assay.pcr_primer_reverse.length}</p>
								</div>
							</div>
							{assay.pcr_primer_reference_reverse && (
								<p className="text-sm">
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
					</div>
					<div className="lg:col-span-3">
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
					Straight parallel lines show the DNA strands, read from 5' to 3'. Letters above/below the highlighted
					segment show the actual primer sequence.
				</p>
			</div>

			<div role="tablist" className="tabs tabs-lifted">
				<input type="radio" name="dataTabs" role="tab" className="tab" aria-label="Samples" defaultChecked />
				<div role="tabpanel" className="tab-content border-base-300 rounded-lg p-6">
					<div className="card-body p-0 overflow-hidden aspect-5/2">
						<Map locations={assay.Samples} cluster />
					</div>
				</div>

				<input type="radio" name="dataTabs" role="tab" className="tab" aria-label="Libraries" />
				<div role="tabpanel" className="tab-content border-base-300 rounded-lg aspect-5/2">
					<Table table="library" where={{ assay_name }} />
				</div>
			</div>
		</div>
	);
}
