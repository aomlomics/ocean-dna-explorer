import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import Link from "next/link";
import { ReactNode, Suspense } from "react";

export default function DropdownCard({
	items,
	query,
	table,
	icon,
	className
}: {
	table: Uncapitalize<Prisma.ModelName>;
	icon: ReactNode;
	className?: string;
} & (
	| { items: (Record<string, any> | string)[]; query?: undefined }
	| { items?: undefined; query: () => Promise<Record<string, string>[]> }
)) {
	return (
		<Suspense fallback={<SuspenseDropdownCard table={table} icon={icon} className={className} />}>
			<SuspenseDropdownCard items={items} query={query} table={table} icon={icon} className={className} />
		</Suspense>
	);
}

async function SuspenseDropdownCard({
	items,
	query,
	table,
	icon,
	className
}: {
	items?: (Record<string, any> | string)[];
	query?: () => Promise<Record<string, any>[]>;
	table: Uncapitalize<Prisma.ModelName>;
	icon: ReactNode;
	className?: string;
}) {
	let queryItems = items;
	if (query) {
		queryItems = await query();
	}

	return (
		<div
			className={`dropdown dropdown-hover bg-base-200 rounded-lg ${queryItems && queryItems.length ? "hover:bg-base-300 hover:rounded-b-none" : ""} ${className ?? ""}`}
		>
			<div tabIndex={0} role="button" className="w-full p-4 flex items-center gap-4 justify-between">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 shrink-0 flex items-center justify-center text-primary">{icon}</div>
					<div>
						<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
							<span className="block">Total</span>
							<span className="block">{TableMetadata[table].plural}</span>
						</div>
						<div className="text-2xl font-bold text-primary">{queryItems ? queryItems.length : "..."}</div>
					</div>
				</div>
				{queryItems && queryItems.length ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-base-content/70"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				) : (
					<></>
				)}
			</div>

			{queryItems && queryItems.length ? (
				<ul
					tabIndex={0}
					className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-1 p-2 shadow"
				>
					{queryItems.map((i) => {
						if (typeof TableMetadata[table].titleField === "string") {
							const val = typeof i === "string" ? i : i[TableMetadata[table].titleField];
							return (
								<li key={val}>
									<Link
										href={`/explore/${table}/${encodeURIComponent(val)}`}
										className="text-base-content hover:text-primary break-all"
									>
										{val}
									</Link>
								</li>
							);
						} else {
							const typed = i as Record<string, string>;
							const joined = TableMetadata[table].titleField.map((f) => encodeURIComponent(typed[f]!)).join("/");
							return (
								<li key={joined}>
									<Link href={`/explore/${table}/${joined}`} className="text-base-content hover:text-primary break-all">
										{joined}
									</Link>
								</li>
							);
						}
					})}
				</ul>
			) : (
				<></>
			)}
		</div>
	);
}
