import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Image from "next/image";
import PrimerDiagram from "@/app/components/PrimerDiagram";
import GcDonut from "@/app/components/charts/GcDonut";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";

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

export default async function Pcr_Primer_Name_Forward_Pcr_Primer_Name_Reverse({
	params
}: {
	params: Promise<{ pcr_primer_name_forward: string; pcr_primer_name_reverse: string }>;
}) {
	const { pcr_primer_name_forward, pcr_primer_name_reverse } = await params;

	const primer = await prisma.primer.findUnique({
		where: {
			pcr_primer_name_forward_pcr_primer_name_reverse: {
				pcr_primer_name_forward,
				pcr_primer_name_reverse
			}
		},
		include: {
			Assays: {
				select: {
					assay_name: true,
					target_gene: true,
					Samples: {
						select: {
							Project: {
								select: {
									isPrivate: true
								}
							}
						}
					}
				}
			}
		}
	});
	if (!primer) return <>Primer not found</>;
	const isPrivate = primer.Assays.some((a) => a.Samples.some((samp) => samp.Project.isPrivate));

	const uniqueAssays = primer.Assays.reduce(
		(acc: Record<string, Record<string, string>>, a) => ({
			...acc,
			[a.assay_name]: { target_gene: a.target_gene }
		}),
		{}
	);

	const forwardGc = calculateGcContent(primer.pcr_primer_forward);
	const reverseGc = calculateGcContent(primer.pcr_primer_reverse);

	return (
		<div className="space-y-6">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/primer" className="text-primary hover:text-primary-focus">
							Primers
						</Link>
					</li>
					<li>{`${pcr_primer_name_forward} / ${pcr_primer_name_reverse}`}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1 className="text-4xl font-semibold text-primary mb-2">
						<span className="text-primary">{primer.pcr_primer_forward}</span>{" "}
						<span className="text-primary/90">{primer.pcr_primer_reverse}</span>
						<span className="text-sm text-base-content/80 ml-1">ID:</span><span className="text-sm">{primer.id} </span>
					</h1>
					{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-sm text-base-content/80 max-w-3xl">
					* Primer names are created by the combination of the forward primer sequence (pcr_primer_forward) and
					the reverse primer sequence (pcr_primer_reverse). This string is unique.
				</p>
			</header>

			{/* Forward Primer Section */}
			<section className="p-6 bg-base-100 rounded-lg border border-base-300">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
					<div className="space-y-4">
						<div>
							<div>
								<p className="text-sm font-medium text-base-content/70">Forward Primer</p>
								<h3 className="text-2xl font-bold text-primary">{primer.pcr_primer_name_forward}</h3>
							</div>
							<div className="mt-3">
								<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
								<p className="font-mono text-base break-all">{primer.pcr_primer_forward}</p>
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
									<p className="text-3xl font-semibold">{primer.pcr_primer_forward.length}</p>
								</div>
							</div>
							{primer.pcr_primer_reference_forward && (
								<p className="text-sm"><a href={primer.pcr_primer_reference_forward} target="_blank" rel="noopener noreferrer" className="link link-primary">View Reference</a></p>
							)}
						</div>
					</div>
					<div className="lg:col-span-3">
						<PrimerDiagram
							forwardPrimerSequence={primer.pcr_primer_forward}
							reversePrimerSequence={primer.pcr_primer_reverse}
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
								<h3 className="text-2xl font-bold text-primary">{primer.pcr_primer_name_reverse}</h3>
							</div>
							<div className="mt-3">
								<p className="text-xs font-semibold text-base-content/70 mb-1">Sequence</p>
								<p className="font-mono text-base break-all">{primer.pcr_primer_reverse}</p>
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
									<p className="text-3xl font-semibold">{primer.pcr_primer_reverse.length}</p>
								</div>
							</div>
							{primer.pcr_primer_reference_reverse && (
								<p className="text-sm"><a href={primer.pcr_primer_reference_reverse} target="_blank" rel="noopener noreferrer" className="link link-primary">View Reference</a></p>
							)}
						</div>
					</div>
					<div className="lg:col-span-3">
						<PrimerDiagram
							forwardPrimerSequence={primer.pcr_primer_forward}
							reversePrimerSequence={primer.pcr_primer_reverse}
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
					Straight parallel lines show the DNA strands, read from 5' to 3'. Letters above/below the highlighted segment show the actual primer sequence.
				</p>
			</div>

			{/* Assays using this Primer */}
			<div className="mb-4">
				<h2 className="text-2xl font-semibold text-base-content/90 mb-4">
					Assays using this Primer ({Object.keys(uniqueAssays).length})
				</h2>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{Object.keys(uniqueAssays).map((assay) => (
						<div key={assay} className="flex items-center gap-4 p-4 bg-base-100 rounded-lg border border-base-300">
							<div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
								<div className="relative w-12 h-12">
									<AssayPhyloPic assayName={assay} />
								</div>
							</div>
							<div>
								<h3 className="font-bold text-lg text-base-content">{uniqueAssays[assay].target_gene}</h3>
								<p className="text-base-content/70">{assay}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
