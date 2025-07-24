"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { EXPLORE_ROUTES } from "@/types/objects";

export default function ExploreTabButtons() {
	const pathname = usePathname();

	return (
		<nav className="flex flex-wrap gap-2">
			{Object.entries(EXPLORE_ROUTES).map(([route, name]) => (
				<Link
					key={route}
					href={`/explore/${route}`}
					className={`btn btn-sm text-base font-normal ${
						pathname?.startsWith(`/explore/${route}`) ? "btn-primary" : "btn-ghost"
					}`}
				>
					{name}
				</Link>
			))}
		</nav>
	);
}
