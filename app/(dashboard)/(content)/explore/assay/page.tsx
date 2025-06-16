import ExploreSearch from "@/app/components/explore/ExploreSearch";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import TableFilter from "@/app/components/explore/filters/TableFilter";
import Pagination from "@/app/components/paginated/Pagination";
import { target_gene } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { AssayScalarFieldEnumSchema, PrimerPartial } from "@/prisma/generated/zod";
import { DeadBooleanEnum } from "@/types/enums";
import Link from "next/link";

export default async function Assay() {
	const assaysWithRelations = await prisma.assay.findMany({
		select: {
			target_subfragment: true,
			pcr_primer_forward: true,
			pcr_primer_reverse: true,
			Primer: {
				select: {
					pcr_primer_name_forward: true,
					pcr_primer_name_reverse: true
				}
			}
		}
	});

	const primers = [] as PrimerPartial[];
	const assays = assaysWithRelations.map((a) => {
		const { Primer: primer, ...justAssay } = a;
		primers.push(primer);
		return justAssay;
	});

	const filterOptions = getOptions(assays);
	const primerFilterOptions = getOptions(primers);
	const { "0": _, "1": __, ...deadBooleanOptions } = DeadBooleanEnum;

	return (
		<div className="grid grid-cols-[300px_1fr] gap-6 pt-6">
			<TableFilter
				tableConfig={[
					{
						field: "pcr_0_1",
						type: "select",
						options: Object.values(deadBooleanOptions),
						optionsLabels: Object.keys(deadBooleanOptions)
					},
					{
						field: "target_gene",
						type: "enum",
						enum: target_gene
					},
					{
						field: "target_subfragment",
						type: "select",
						options: filterOptions.target_subfragment
					},
					{
						field: "pcr_primer_forward",
						type: "select",
						options: filterOptions.pcr_primer_forward
					},
					{
						field: "pcr_primer_reverse",
						type: "select",
						options: filterOptions.pcr_primer_reverse
					},
					{
						field: { rel: "Primer", f: "pcr_primer_name_forward" },
						type: "select",
						options: primerFilterOptions.pcr_primer_name_forward
					},
					{
						field: { rel: "Primer", f: "pcr_primer_name_reverse" },
						type: "select",
						options: primerFilterOptions.pcr_primer_name_reverse
					}
				]}
			/>
			<div className="space-y-6">
				<div className="space-y-[-1px]">
					<div className="border-b border-base-300">
						<nav className="flex tabs tabs-lifted">
							<ExploreTabButtons />
						</nav>
					</div>
					<div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
						<p className="mb-2">
							Laboratory protocols used to analyze samples, specifying primers, controls, PCR protocols, and target
							genes for DNA amplification.
						</p>
						<p className="text-sm">
							For more detailed information, visit our{" "}
							<Link href="/help" className="text-primary hover:underline">
								Help page
							</Link>
							.
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<ExploreSearch
						title="Assays"
						table="assay"
						fieldOptions={AssayScalarFieldEnumSchema._def.values}
						defaultField="assay_name"
					/>

					<div className="bg-base-100 rounded-lg border border-base-300">
						<Pagination
							id="assay_name"
							table="assay"
							title="assay_name"
							fields={["pcr_primer_forward", "pcr_primer_reverse"]}
							relCounts={["Samples", "Libraries", "Analyses"]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
