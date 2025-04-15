import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import DropdownLinkBox from "@/app/components/DropdownLinkBox";

export default async function Samp_Name({ params }: { params: Promise<{ samp_name: string }> }) {
	const { samp_name } = await params;

	const { sample, analyses } = await prisma.$transaction(async (tx) => {
		const sample = await tx.sample.findUnique({
			where: {
				samp_name
			},
			include: {
				Occurrences: {
					select: {
						featureid: true
					}
				},
				Assays: {
					select: {
						assay_name: true
					}
				}
			}
		});

		const occs = await tx.occurrence.findMany({
			where: {
				samp_name
			},
			distinct: ["analysis_run_name"]
		});

		return { sample, analyses: occs.map((occ) => occ.analysis_run_name) };
	});

	if (!sample) return <>Sample not found</>;
	const { Occurrences: _, ...justSample } = sample;

	const featuresCount = {} as Record<string, number>;
	for (const { featureid } of sample.Occurrences) {
		if (featureid in featuresCount) {
			featuresCount[featureid] += 1;
		} else {
			featuresCount[featureid] = 1;
		}
	}
	const sortedFeatures = Object.entries(featuresCount).sort(([, a], [, b]) => b - a);

	return (
		<div className="space-y-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs mb-6">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>
						<Link href={`/explore/project/${sample.project_id}`} className="text-primary hover:text-primary-focus">
							{sample.project_id}
						</Link>
					</li>
					<li>
						<Link href={`/explore/sample`} className="text-primary hover:text-primary-focus">
							Samples
						</Link>
					</li>
					<li>{samp_name}</li>
				</ul>
			</div>

			<div className="grid grid-cols-2 gap-8">
				<div className="col-span-2">
					<header className="flex gap-2 items-center">
						<h1 className="text-4xl font-semibold text-primary mb-2">{samp_name}</h1>
						{sample.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
					</header>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="stat bg-base-200 p-6">
							<div className="text-lg font-medium text-base-content/70">Total Occurrences</div>
							<div className="text-base mt-1">{sample.Occurrences.length}</div>
						</div>
						<DropdownLinkBox
							title="Total Analyses"
							count={analyses.length}
							content={analyses}
							linkPrefix="/explore/analysis"
						/>
						<DropdownLinkBox
							title="Total Assays"
							count={sample.Assays.length}
							content={sample.Assays.map((a) => a.assay_name)}
							linkPrefix="/explore/assay"
						/>
					</div>
				</div>

				<div className="bg-base-200 p-6 h-full">
					<div className="text-lg font-medium text-base-content/70">Sample Information</div>
					<div className="h-[300px] overflow-y-auto mt-4">
						<DataDisplay data={justSample} omit={["id", "project_id", "userId", "analysis_run_name", "assay_name"]} />
					</div>
				</div>
			</div>

			<div className="card-body p-0 overflow-hidden h-[400px]">
				<Map locations={[sample]} id="samp_name" table="sample" />
			</div>
		</div>
	);
}
