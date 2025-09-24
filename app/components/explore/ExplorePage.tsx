
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
		<div className="pt-2 pb-6 lg:py-6">{children}</div>
	);
} 