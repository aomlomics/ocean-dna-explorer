"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@/app/generated/prisma/client";
import { uncapitalizeTable } from "@/app/helpers/utils";
import TableMetadata, { TableNames } from "@/types/tableMetadata";

export default function ExploreTabButtons({
	activeTable
}: {
	activeTable?: Prisma.ModelName;
} = {}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tableParam = searchParams.get("table");

    function isOnPath(table: Prisma.ModelName) {
        if (activeTable) return uncapitalizeTable(activeTable) === uncapitalizeTable(table);

		const splitPath = pathname.split("/");
		if (splitPath.includes("explore")) {
			for (let i = 0; i < splitPath.length; i++) {
				if (splitPath[i] === "explore" && splitPath[i + 1] === uncapitalizeTable(table)) {
					return true;
				}
			}
        } else if (splitPath.includes("search")) {
            if (tableParam) {
                return uncapitalizeTable(tableParam as Prisma.ModelName) === uncapitalizeTable(table);
            }
            return uncapitalizeTable("Project" as Prisma.ModelName) === uncapitalizeTable(table);
		}
	}

	return (
		<nav className="flex flex-wrap gap-2">
			{TableNames.map((table) => {
				const modelName = table as Prisma.ModelName;
				const uncapitalizedTableName = uncapitalizeTable(modelName);
				const href =
					pathname.split("/").includes("explore")
						? `/explore/${uncapitalizedTableName}`
						: `/search?table=${modelName}`;

				return (
					<Link
						key={table}
						href={href}
						className={`btn btn-sm text-base font-normal normal-case ${
							isOnPath(modelName)
								? "btn-primary"
								: "bg-base-200 hover:bg-base-300 border-transparent hover:border-transparent"
						}`}
					>
						{TableMetadata[modelName].plural}
					</Link>
				);
			})}
		</nav>
	);
}
