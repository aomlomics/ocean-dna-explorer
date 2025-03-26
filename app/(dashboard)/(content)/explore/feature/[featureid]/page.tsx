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
			{/* TODO: make dropdowns separate component */}
			<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300">
				<div tabIndex={0} role="button" className="stat focus:bg-base-300 w-full p-6 flex justify-between items-center">
					<div>
						<div className="text-lg font-medium text-base-content/70">Assays</div>
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
				<ul
					tabIndex={0}
					className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-[1] p-2 shadow"
				>
					{assays.map((assay_name) => (
						<li key={assay_name}>
							<Link href={`/explore/assay/${assay_name}`} className="text-base-content hover:text-primary break-all">
								{assay_name}
							</Link>
						</li>
					))}
				</ul>
			</div>
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
