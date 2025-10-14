"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@/app/generated/prisma/client";
import { uncapitalizeTable } from "@/app/helpers/utils";
import TableMetadata from "@/types/tableMetadata";

export default function ExploreTabButtons() {
	const pathname = usePathname();

	return (
		<nav className="flex flex-wrap gap-2">
			{Object.keys(Prisma.ModelName).map((table) => (
				<Link
					key={table}
					href={`/explore/${uncapitalizeTable(table as Prisma.ModelName)}`}
					className={`btn btn-sm text-base font-normal normal-case ${
						pathname?.startsWith(`/explore/${uncapitalizeTable(table as Prisma.ModelName)}`)
							? "btn-primary"
							: "bg-base-200 hover:bg-base-300 border-transparent hover:border-transparent"
					}`}
				>
					{TableMetadata[table as Prisma.ModelName].plural}
				</Link>
			))}
		</nav>
	);
}
