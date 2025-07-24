"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SearchTabButtons() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	return (
		<nav className="flex tabs tabs-lifted">
			<Link
				href={`/search?${searchParams}`}
				className={`px-6 py-3 text-base transition-colors border-b-0 border-x border-t font-medium ${
					pathname === "/search"
						? "border-base-300 rounded-t-lg bg-base-100 text-primary"
						: "border-base-200 text-base-content hover:text-primary/80"
				}`}
			>
				Search
			</Link>
			<Link
				href={`/search/advanced?${searchParams}`}
				className={`px-6 py-3 text-base transition-colors border-b-0 border-x border-t font-medium ${
					pathname === "/search/advanced"
						? "border-base-300 rounded-t-lg bg-base-100 text-primary"
						: "border-base-200 text-base-content hover:text-primary/80"
				}`}
			>
				Advanced
			</Link>
		</nav>
	);
}
