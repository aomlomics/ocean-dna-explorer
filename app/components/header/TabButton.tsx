"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function TabButton({ tabName, route }: { tabName: string; route: string }) {
	const pathname = usePathname();

	// Special case for home route to prevent it from matching all paths
	const isActive = route === "/" ? pathname === "/" : pathname.startsWith(route);

	return (
		<Link
			href={route}
			className={[
				"relative z-20 flex items-center px-2.5 min-[1400px]:px-4 py-2 transition-colors text-sm min-[1400px]:text-lg select-none rounded-t-xl",
				isActive
					? "bg-primary text-primary-content"
					: [
							"hover:bg-base-300",
							"hover:text-base-content"
						].join(" ")
			].join(" ")}
		>
			{tabName}
		</Link>
	);
}
