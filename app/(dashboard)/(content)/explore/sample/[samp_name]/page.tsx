import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import DropdownLinkBox from "@/app/components/DropdownLinkBox";
import { Sample } from "@/app/generated/prisma/client";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";

export default async function Samp_name({ params }: { params: Promise<{ samp_name: Sample["samp_name"] }> }) {
	let { samp_name } = await params;
	samp_name = decodeURIComponent(samp_name);

	const { sample, analyses, assayData } = await prisma.$transaction(async (tx) => {
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
				},
				Project: {
					select: {
						isPrivate: true
					}
				}
			}
		});

		if (!sample) return { sample: null, analyses: [], assayData: [] };

		const occs = await tx.occurrence.findMany({
			where: {
				samp_name
			},
			distinct: ["analysis_run_name"]
		});

		const assays = await tx.assay.findMany({
			where: {
				assay_name: {
					in: sample.Assays.map((a) => a.assay_name)
				}
			},
			select: {
				assay_name: true,
				target_gene: true
			}
		});

		return { sample, analyses: occs.map((occ) => occ.analysis_run_name), assayData: assays };
	});

	if (!sample) return <>Sample not found</>;
	const { Occurrences: _, Assays: __, Project: ___, ...justSample } = sample;

	return (
		<div className="space-y-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
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

			<header>
				<div className="flex gap-2 items-center">
					<h1 className="text-4xl font-semibold text-primary mb-2">{samp_name}</h1>
					{sample.Project.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">
					This sample is a part of the{" "}
					<Link href={`/explore/project/${sample.project_id}`} className="text-primary hover:text-primary-focus">
						{sample.project_id}
					</Link>{" "}
					project
				</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				{/* Left column - Map and Assays */}
				<div className="space-y-8">
					{/* Square Map */}
					<div className="aspect-square w-full">
						<Map locations={[sample]} />
					</div>

					{/* Assays Section */}
					<div>
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">
							Assays used on this Sample ({assayData.length})
						</h2>
						<div className="space-y-2">
							{assayData.map((assay) => (
								<div key={assay.assay_name} className="flex items-center gap-4 p-4 rounded-lg">
									<div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
										<div className="relative w-12 h-12">
											<AssayPhyloPic assayName={assay.assay_name} />
										</div>
									</div>
									<div>
										<h3 className="font-bold text-lg text-base-content">{assay.target_gene}</h3>
										<p className="text-base-content/70">{assay.assay_name}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Right column - Stats and Information */}
				<div className="lg:col-span-2 space-y-8">
					{/* Stats Grid */}
					<div className="grid grid-cols-3 gap-4">
						<SampleStatCard title="Occurrences" value={sample.Occurrences.length} />
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
						<SampleStatCard
							title="Location"
							latitude={sample.decimalLatitude}
							longitude={sample.decimalLongitude}
							icon="location"
						/>
						<div className="bg-base-200 p-6 rounded-lg"></div>
						<div className="bg-base-200 p-6 rounded-lg"></div>
					</div>

					{/* Sample Information */}
					<div className="bg-base-200 p-6">
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Sample Information</h2>
						<div className="h-[300px] overflow-y-auto">
							<DataDisplay table="sample" data={justSample} omit={["project_id", "analysis_run_name", "assay_name"]} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

type StatIconType = "location";

function SampleStatCard({
	title,
	value,
	latitude,
	longitude,
	icon
}: {
	title: string;
	value?: number;
	latitude?: number | null;
	longitude?: number | null;
	icon?: StatIconType;
}) {
	const content = (
		<div className="bg-base-200 p-6 rounded-lg flex flex-col items-center text-center">
			{icon && (
				<div className="w-16 h-16 mb-2 flex items-center justify-center text-primary">
					<StatIcon icon={icon} />
				</div>
			)}
			{value !== undefined && (
				<div className="text-3xl font-bold text-primary mb-1">{value.toLocaleString()}</div>
			)}
			{latitude !== undefined && longitude !== undefined && (
				<div className="text-lg text-base-content">
					{latitude !== null && longitude !== null ? (
						<>
							<div className="font-semibold text-base-content/80">Lat: {latitude.toFixed(4)}</div>
							<div className="font-semibold text-base-content/80">Lon: {longitude.toFixed(4)}</div>
						</>
					) : (
						<div className="text-base-content/60">N/A</div>
					)}
				</div>
			)}
			<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">{title}</div>
		</div>
	);

	return content;
}

function StatIcon({ icon }: { icon: StatIconType }) {
	const getIconData = () => {
		switch (icon) {
			case "location":
				return {
					viewBox: "0 0 24 24",
					path: (
						<path
							fill="currentColor"
							stroke="none"
							d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
						/>
					)
				};
			default:
				return { viewBox: "0 0 24 24", path: null };
		}
	};

	const { viewBox, path } = getIconData();

	return (
		<svg className="w-12 h-12" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.5">
			{path}
		</svg>
	);
}
