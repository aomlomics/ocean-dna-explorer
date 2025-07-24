
import { ReactNode } from "react";
import Pagination from "@/app/components/paginated/Pagination";
import Table from "@/app/components/paginated/Table";
import { FilterConfig } from "./filters/filterHelpers";
import TableFilter from "./filters/TableFilter";
import { Prisma } from "@/app/generated/prisma/client";
import TaxaGrid from "../paginated/TaxaGrid";

export default function ExplorePage({
	table,
	tableConfig,
	children
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableConfig: FilterConfig[];
	children: ReactNode;
}) {
	return (
		<div className="drawer lg:drawer-open">
			<input id="my-drawer" type="checkbox" className="drawer-toggle" />
			<div className="drawer-content pt-2 pb-6 lg:p-6">{children}</div>
			<div className="drawer-side lg:border-r lg:border-base-300">
				<label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
				<div className="p-4 w-72 min-h-full bg-base-100 text-base-content lg:bg-transparent lg:p-0 lg:w-80">
					<TableFilter tableConfig={tableConfig} />
				</div>
			</div>
		</div>
	);
} 