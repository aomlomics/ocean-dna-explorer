import { prisma } from "../helpers/prisma";
import Link from "next/link";

export default async function DataSummary() {
	const { projectCount, sampleCount, taxaCount, featureCount, uniqueAssays } = await prisma.$transaction(async (tx) => {
		const projectCount = await tx.project.count({
			where: {
				isPrivate: false
			}
		});
		const sampleCount = await tx.sample.count({
			where: {
				isPrivate: false
			}
		});
		const taxaCount = await tx.taxonomy.count({
			where: {
				isPrivate: false
			}
		});
		const featureCount = await tx.feature.count({
			where: {
				isPrivate: false
			}
		});
		const uniqueAssays = (await tx.assay.findMany({
			where: {
				isPrivate: false
			},
			distinct: ["target_gene"],
			select: {
				target_gene: true
			}
		})) as { target_gene: string; count?: number }[];

		for (const a of uniqueAssays) {
			//get count of features that were assigned using a particular target gene
			//number of assignments = number of features (an assignment has only one feature)
			const count = await tx.analysis.findFirst({
				where: {
					isPrivate: false,
					Assay: {
						target_gene: a.target_gene
					}
				},
				select: {
					_count: {
						select: {
							Assignments: true
						}
					}
				}
			});
			if (count) {
				a.count = count._count.Assignments;
			}
		}

		return { projectCount, sampleCount, taxaCount, featureCount, uniqueAssays };
	});

	return (
		<div>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
				<div className="col-span-3 border-b-2 border-primary text-center text-2xl text-primary">Data Summary</div>
				<DataSummaryItem title="Projects" value={projectCount} href="/explore/project" />
				<DataSummaryItem title="Samples" value={sampleCount} href="/explore/sample" />
				<DataSummaryItem title="Taxonomies" value={taxaCount} href="/explore/taxonomy" />
				<div className="col-span-3 border-b-2 border-primary text-center text-2xl text-primary">Assays</div>
				{uniqueAssays.map((a) => (
					<DataSummaryItem
						key={a.target_gene}
						title={a.target_gene + " Features"}
						value={a.count || 0}
						href="/explore/assay"
					/>
				))}
			</div>
		</div>
	);
}

function DataSummaryItem({ title, value, href }: { title: string; value: number; href: string }) {
	return (
		<Link
			href={href}
			className="bg-base-200 hover:bg-base-300 active:bg-interactive-active p-6 rounded-lg text-center shadow-sm transition-colors"
		>
			<h3 className="text-main text-lg mb-2">{title}</h3>
			<p className="text-primary text-3xl font-bold">{value.toLocaleString()}</p>
		</Link>
	);
}
