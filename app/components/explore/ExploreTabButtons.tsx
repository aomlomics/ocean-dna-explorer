"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@/app/generated/prisma/client";
import { uncapitalizeTable } from "@/app/helpers/utils";
import TableMetadata, { TableNames } from "@/types/tableMetadata";

export default function ExploreTabButtons() {
	const pathname = usePathname();

	function isOnPath(table: Prisma.ModelName) {
		const splitPath = pathname.split("/");
		for (let i = 0; i < splitPath.length; i++) {
			if (splitPath[i] === "explore" && splitPath[i + 1] === uncapitalizeTable(table)) {
				return true;
			}
		}
	}

	return (
		<nav className="flex flex-wrap gap-2">
			{TableNames.map((table) => (
				<Link
					key={table}
					href={`/explore/${uncapitalizeTable(table as Prisma.ModelName)}`}
					className={`btn btn-sm text-base font-normal normal-case ${
						isOnPath(table as Prisma.ModelName)
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
