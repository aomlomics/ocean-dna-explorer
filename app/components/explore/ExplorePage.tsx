
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
	children,
	title
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableConfig: FilterConfig[];
	children: ReactNode;
	title: string;
}) {
	return (
		<div className="grid grid-cols-1 gap-y-4 pt-4">
			<header>
				<h1 className="text-4xl font-normal text-base-content">
					<span className="">Explore</span> <span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
					<span className="text-primary font-normal">{title}</span>
				</h1>
			</header>

			{children}
			
			<TableFilter tableConfig={tableConfig} />

			<div className="aspect-5/2 hidden lg:block">
				<div className="rounded-lg border border-base-300 h-full">
					<Table table={table} defaultTake={25} hideEmptyAtStart filterHeadersAtStart />
				</div>
			</div>
			<div className="lg:hidden">
				<Pagination table={table} />
			</div>

		</div>
	);
} 