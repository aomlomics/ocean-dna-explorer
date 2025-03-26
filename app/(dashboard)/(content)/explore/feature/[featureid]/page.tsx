import DropdownLinkBox from "@/app/components/DropdownLinkBox";
import Pagination from "@/app/components/paginated/Pagination";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { ReactNode } from "react";

export default async function Featureid({ params }: { params: Promise<{ featureid: string }> }) {
	let { featureid } = await params;
	featureid = decodeURIComponent(featureid);

	const { feature, taxaCounts, prevalence, assays } = await prisma.$transaction(async (tx) => {
		const feature = await tx.feature.findUnique({
			where: {
				featureid
			},
			include: {
				Assignments: {
					distinct: ["taxonomy"],
					select: {
						taxonomy: true
					}
				},
				_count: {
					select: {
						Assignments: true
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

		const relevantSamplesCount = await tx.sample.count({
			where: {
				Occurrences: {
					some: {
						featureid
					}
				}
			}
		});
		const samplesCount = await tx.sample.count();
		const prevalence = (relevantSamplesCount / samplesCount) * 100;

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

		return { feature, taxaCounts, prevalence, assays };
	});

	if (!feature) return <>Feature not found</>;

	taxaCounts.sort((a, b) => b.count - a.count);

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-4xl font-semibold text-primary mb-2">{feature.featureid}</h1>
				<p className="text-md text-base-content/70 break-all font-mono">{feature.dna_sequence}</p>
			</header>
			<div>
				<h2 className="text-primary text-2xl">Taxonomy</h2>
				<div className="grid grid-cols-2 gap-4">
					{taxaCounts.reduce((acc: ReactNode[], { taxonomy, count }) => {
						acc.push(
							<div className="break-words" key={`${taxonomy}1`}>
								{taxonomy}
							</div>
						);
						acc.push(
							<div key={`${taxonomy}2`}>
								{count} ({(count / feature._count.Assignments) * 100}%)
							</div>
						);

						return acc;
					}, [])}
				</div>
			</div>
			<div>
				<h2 className="text-primary text-2xl">Prevalence</h2>
				<div>Found in {prevalence.toFixed(2)}% of samples.</div>
			</div>
			<DropdownLinkBox title="Assays" content={assays} linkPrefix="/explore/assay" />
			<div role="tablist" className="tabs tabs-lifted">
				<input type="radio" defaultChecked name="dataTabs" role="tab" className="tab" aria-label="Occurrences" />
				<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
					<Pagination
						table="occurrence"
						where={{ featureid }}
						title={["analysis_run_name", "samp_name"]}
						fields={["organismQuantity"]}
					/>
				</div>

				<input type="radio" name="dataTabs" role="tab" className="tab" aria-label="Assignments" />
				<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
					<Pagination
						table="assignment"
						where={{ featureid }}
						title={["analysis_run_name", "taxonomy"]}
						fields={["Confidence"]}
					/>
				</div>
			</div>
		</div>
	);
}
