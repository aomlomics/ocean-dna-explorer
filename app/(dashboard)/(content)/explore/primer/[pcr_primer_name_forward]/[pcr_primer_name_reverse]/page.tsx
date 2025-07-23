import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Image from "next/image";
import PrimerDiagram from "@/app/components/PrimerDiagram";

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

	return (
		<div className="space-y-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs mb-6">
				<ul>
					<li>
						<Link href="/explore/primer" className="text-primary hover:text-primary-focus">
							Primers
						</Link>
					</li>
					<li>{`${pcr_primer_name_forward} / ${pcr_primer_name_reverse}`}</li>
				</ul>
			</div>

			<div className="grid grid-cols-4 gap-8 mb-3">
				<div className="col-span-4">
					<header>
						<div className="flex gap-2 items-center">
							<h1 className="text-4xl font-semibold text-primary mb-2">
								<span className="text-base-content/80">{primer.pcr_primer_forward}</span>{" "}
								<span className="text-base-content/70">{primer.pcr_primer_reverse}</span>
								<span className="text-sm text-base-content/80 ml-1">ID:</span><span className="text-sm">{primer.id} </span>
							</h1>
							{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
						</div>
						<p className="text-sm text-base-content/80">
							* Primer names are created by the combination of the forward primer sequence (pcr_primer_forward) and
							the reverse primer sequence (pcr_primer_reverse). This string is unique.
						</p>
					</header>
				</div>

				<div className="col-span-4">
					<PrimerDiagram
						forwardPrimerName={primer.pcr_primer_name_forward}
						forwardPrimerSequence={primer.pcr_primer_forward}
						reversePrimerName={primer.pcr_primer_name_reverse}
						reversePrimerSequence={primer.pcr_primer_reverse}
						forwardPrimerReference={primer.pcr_primer_reference_forward}
						reversePrimerReference={primer.pcr_primer_reference_reverse}
					/>
					<div className="mt-4 p-4 bg-base-100 rounded-lg border border-base-content/10 space-y-4">
						<div>
							<h4 className="text-base-content mb-1">Legend:</h4>
							<div className="flex gap-6 text-sm">
								<div className="flex items-center gap-2">
									<div className="w-4 h-2 bg-primary rounded animate-pulse"></div>
									<span className="font-normal/80">Actual primer sequence (blinking)</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-4 h-2 bg-secondary rounded"></div>
									<span>Template/complementary strand</span>
								</div>
							</div>
							<p className="text-sm text-base-content/80 mt-2">
								<span className="text-base-content">How to read this diagram:</span> These horizontal DNA helix representations show
								the reverse primer (top) and forward primer (bottom) with 5' (5-prime) and 3' (3-prime) indicators at the left and right ends of
								each DNA backbone. The primer sequences are to be read from the 5' to the 3' end. The
								<span className="text-primary"> blinking strands represent the actual primer sequences</span>, 
								while the non-blinking strands are the complementary template DNA that the primers bind to during PCR. 
								Each helix shows the top and bottom backbones of the DNA double helix, with the primer binding to its complementary sequence.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-base-200">
				<div className="card-body">
					<h2 className="card-title text-base-content/70">
						Assays using this Primer: {Object.keys(uniqueAssays).length}
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 mb-2">
						{Object.keys(uniqueAssays).map((assay, index) => {
							const imagePath = `/images/${assay}_icon.svg`;

							return (
								<div key={index} className="card bg-base-300 shadow-sm">
									<div className="card-body">
										<div className="flex items-center gap-4">
											<div className="w-16 h-16">
												<Image src={imagePath} alt={assay} width={64} height={64} className="object-contain" />
											</div>
											<div>
												<h3 className="font-medium">{uniqueAssays[assay].target_gene}</h3>
												<p className="text-sm text-base-content">{assay}</p>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
