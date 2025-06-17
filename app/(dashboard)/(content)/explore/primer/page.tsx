import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import TableFilter from "@/app/components/explore/filters/TableFilter";
import Pagination from "@/app/components/paginated/Pagination";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExploreSearch from "@/app/components/explore/ExploreSearch";
import { PrimerScalarFieldEnumSchema } from "@/prisma/generated/zod";

export default async function Primer() {
	const primers = await prisma.primer.findMany({
		select: {
			pcr_primer_forward: true,
			pcr_primer_name_forward: true,
			pcr_primer_reverse: true,
			pcr_primer_name_reverse: true
		}
	});
	if (!primers) return <>Loading...</>;

	const filterOptions = getOptions(primers);

	return (
		<div className="grid grid-cols-[300px_1fr] gap-6 pt-6">
			<TableFilter
				tableConfig={[
					{
						field: "pcr_primer_forward",
						type: "select",
						options: filterOptions.pcr_primer_forward
					},
					{
						field: "pcr_primer_name_forward",
						type: "select",
						options: filterOptions.pcr_primer_name_forward
					},
					{
						field: "pcr_primer_reverse",
						type: "select",
						options: filterOptions.pcr_primer_reverse
					},
					{
						field: "pcr_primer_name_reverse",
						type: "select",
						options: filterOptions.pcr_primer_name_reverse
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
						<p className="mb-2">TODO: Fill in information about primers</p>
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
						table="primer"
						fieldOptions={PrimerScalarFieldEnumSchema._def.values}
						defaultField="pcr_primer_forward"
					/>

					<div className="bg-base-100 rounded-lg border border-base-300">
						<Pagination
							id={["pcr_primer_name_forward", "pcr_primer_name_reverse"]}
							table="primer"
							title={["pcr_primer_name_forward", "pcr_primer_name_reverse"]}
							fields={["pcr_primer_forward", "pcr_primer_reverse"]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
