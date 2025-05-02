"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { EXPLORE_ROUTES } from "@/types/objects";

export default function ExploreTabButtons() {
	const pathname = usePathname();

	return (
		<nav className="flex tabs tabs-lifted">
			{Object.entries(EXPLORE_ROUTES).map(([route, name]) => (
				<Link
					key={route}
					href={`/explore/${route}`}
					className={`px-6 py-3 text-base transition-colors border-b-0 border-x border-t font-medium ${
						pathname.startsWith(`/explore/${route}`)
							? "border-base-300 rounded-t-lg bg-base-100 text-primary"
							: "border-base-200 text-base-content hover:text-primary/80"
					}`}
				>
					{name}
				</Link>
			))}
		</nav>
	);
}
