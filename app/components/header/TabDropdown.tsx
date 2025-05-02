"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function TabDropdown({
	tabName,
	route,
	dropdown
}: {
	tabName: string;
	route: string;
	dropdown: Array<{ label: string; href: string }>;
}) {
	const router = useRouter();
	const pathname = usePathname();

	// Special case for home route to prevent it from matching all paths
	const isActive = route === "/" ? pathname === "/" : pathname.startsWith(route);

	//black magic do not touch
	function __unfocus() {
		const el = document.getElementById("unfocusButton");
		if (el) {
			el.focus();
			el.blur();
		}
	}

	function unfocus() {
		__unfocus();
	}

	return (
		<div
			onClick={unfocus}
			className={`dropdown dropdown-hover rounded-t-lg ${isActive ? "bg-primary text-white" : "hover:bg-base-300"}`}
		>
			<Link href={route} className="px-4 py-2 inline-block">
				{tabName}
			</Link>
			<ul
				tabIndex={0}
				className={`dropdown-content menu rounded-box z-[1] w-52 p-2 shadow rounded-t-none bg-base-300 ${
					isActive ? "bg-primary text-white" : "bg-base-300"
				}`}
			>
				{dropdown.map(({ label, href }) => (
					<li key={label} className={isActive ? "hover:bg-accent rounded-lg" : ""}>
						<Link href={href}>{label}</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
