"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { unfocus } from "@/app/helpers/utils";

export default function TabDropdown({
	tabName,
	route,
	dropdown
}: {
	tabName: string;
	route: string;
	dropdown: Array<{ label: string; href: string }>;
}) {
	const pathname = usePathname();

	// Special case for home route to prevent it from matching all paths
	const isActive = route === "/" ? pathname === "/" : pathname.startsWith(route);

	return (
		<div
			onClick={unfocus}
			className={`dropdown dropdown-hover rounded-t-lg ${
				isActive ? "bg-primary text-primary-content" : "hover:bg-base-300"
			}`}
		>
			<Link href={route} className="px-4 py-2 inline-block">
				{tabName}
			</Link>
			<ul
				tabIndex={0}
				className={`dropdown-content menu rounded-box w-48 p-2 shadow rounded-t-none z-99999 ${
					isActive ? "bg-primary text-primary-content" : "bg-base-300"
				}`}
			>
				{dropdown.map(({ label, href }) => (
					<li key={label}>
						<Link href={href} className={`rounded-lg ${isActive ? "hover:bg-white/10" : "hover:bg-base-100/50"}`}>
							{label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
