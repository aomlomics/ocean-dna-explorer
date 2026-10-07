"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
	{ id: "edna101", label: "eDNA 101", href: "/learn/edna101" },
	{ id: "impact", label: "Impact", href: "/learn/impact" },
	{ id: "discoveries", label: "Discover Anything", href: "/learn/discoveries" }
] as const;

export default function LearnSectionToggle() {
	const pathname = usePathname();
	const activeIndex = Math.max(
		0,
		TABS.findIndex((t) => pathname === t.href || pathname?.startsWith(`${t.href}/`))
	);

	return (
		<nav
			className="relative mt-5 flex w-full max-w-2xl mx-auto flex-wrap justify-center gap-0.5 rounded-xl bg-base-200/90 p-1 shadow-inner"
			aria-label="Learn sections"
		>
			{/* Sliding pill */}
			<div
				className="absolute top-1 bottom-1 rounded-lg bg-primary shadow-md transition-[left] duration-300 ease-out will-change-[left]"
				style={{
					left: `calc(4px + (100% - 8px) * ${activeIndex} / ${TABS.length})`,
					width: `calc((100% - 8px) / ${TABS.length})`
				}}
				aria-hidden
			/>
			{TABS.map((tab, index) => {
				const isActive = index === activeIndex;
				return (
					<Link
						key={tab.id}
						href={tab.href}
						aria-current={isActive ? "page" : undefined}
						className={`relative z-10 flex-1 min-w-0 py-2 px-3 text-center text-sm sm:text-base font-normal rounded-lg transition-all duration-200 ${
							isActive ? "pointer-events-none" : ""
						}`}
					>
						<span
							className={`block leading-tight ${isActive ? "text-primary-content" : "text-base-content/60 hover:text-base-content/90"}`}
						>
							{tab.label}
						</span>
					</Link>
				);
			})}
		</nav>
	);
}
