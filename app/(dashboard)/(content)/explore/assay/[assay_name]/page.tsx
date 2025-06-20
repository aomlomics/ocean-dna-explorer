import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import Table from "@/app/components/paginated/Table";
import DropdownLinkBox from "@/app/components/DropdownLinkBox";

export default async function Assay_name({ params }: { params: Promise<{ assay_name: string }> }) {
	const { assay_name } = await params;

	const assay = await prisma.assay.findUnique({
		where: {
			assay_name
		},
		include: {
			Samples: true,
			Libraries: true,
			Analyses: {
				select: {
					analysis_run_name: true
				}
			}
		}
	});

	if (!assay) return <>Sample not found</>;
	const { Samples: _, Libraries: __, Analyses: ___, ...justAssay } = assay;

	return (
		<div className="space-y-8">
			{/* Breadcrumb navigation */}
			{/* <div className="text-base breadcrumbs mb-6">
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
			</div> */}

			<div className="grid grid-cols-2 gap-8">
				<div className="col-span-2">
					<header className="flex gap-2 items-center">
						<h1 className="text-4xl font-semibold text-primary mb-2">{assay_name}</h1>
						{assay.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
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
						<DataDisplay data={justAssay} omit={["assay_name"]} />
					</div>
				</div>
			</div>

			<div role="tablist" className="tabs tabs-lifted">
				<input type="radio" name="dataTabs" role="tab" className="tab" aria-label="Samples" defaultChecked />
				<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
					<div className="card-body p-0 overflow-hidden h-[600px]">
						<Map locations={assay.Samples} id="samp_name" table="sample" cluster />
					</div>
				</div>

				<input type="radio" name="dataTabs" role="tab" className="tab" aria-label="Libraries" />
				<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6 !h-[600px] w-full">
					<Table table="library" title="lib_id" where={{ assay_name }}></Table>
				</div>
			</div>
		</div>
	);
}
