"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { uncapitalizeTable } from "@/app/helpers/utils";
import TableMetadata, { DataTableNames, type ModelName } from "@/types/tableMetadata";

const tabBase =
	"inline-flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm font-medium transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-[0.9375rem]";

export default function ExploreTabButtons({
	activeTable,
	className
}: {
	activeTable?: ModelName;
	className?: string;
} = {}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tableParam = searchParams.get("table");

	function isOnPath(table: ModelName) {
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
				return uncapitalizeTable(tableParam as ModelName) === uncapitalizeTable(table);
			}
			return uncapitalizeTable("Project" as ModelName) === uncapitalizeTable(table);
		}
	}

	return (
		<nav
			className={["flex min-w-0 flex-wrap content-center items-center gap-2 sm:gap-2", className]
				.filter(Boolean)
				.join(" ")}
			aria-label="Data tables"
		>
			{DataTableNames.map((t) => {
				const modelName = t as ModelName;
				const uncapitalizedTableName = uncapitalizeTable(modelName);
				const href = pathname.split("/").includes("explore")
					? `/explore/${uncapitalizedTableName}`
					: `/search?table=${modelName}`;
				const active = isOnPath(modelName);

				return (
					<Link
						key={t}
						href={href}
						className={`${tabBase} ${
							active
								? "bg-primary text-primary-content shadow-md"
								: "bg-base-200/90 text-base-content hover:bg-base-300 active:brightness-95"
						}`}
						aria-current={active ? "page" : undefined}
					>
						{TableMetadata[modelName].plural}
					</Link>
				);
			})}
		</nav>
	);
}
