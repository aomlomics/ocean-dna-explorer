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
				"before:pointer-events-none before:absolute before:-left-px before:-right-px before:top-full before:z-30 before:h-1 before:content-['']",
				isActive
					? "bg-primary text-primary-content before:bg-primary"
					: [
							"hover:bg-base-300",
							"before:bg-transparent hover:before:bg-base-300",
							"after:pointer-events-none after:absolute after:-inset-1 after:rounded-t-xl after:rounded-b-none after:border-4 after:border-transparent after:content-['']",
							"hover:after:border-t-primary hover:after:border-l-primary hover:after:border-r-primary hover:after:border-b-transparent"
						].join(" ")
			].join(" ")}
		>
			{tabName}
		</Link>
	);
}
