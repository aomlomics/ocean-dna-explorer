"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function TabButton({ tabName, route }: { tabName: string; route: string }) {
	const pathname = usePathname();

	// Special case for home route to prevent it from matching all paths
	const isActive = route === "/" ? pathname === "/" : pathname.startsWith(route);

	return (
		<Link href={route} className={`px-4 py-2 rounded-t-lg ${isActive ? "bg-primary text-white" : "hover:bg-base-300"}`}>
			{tabName}
		</Link>
	);
}
