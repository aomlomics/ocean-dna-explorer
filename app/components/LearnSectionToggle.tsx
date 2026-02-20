"use client";

import Link from "next/link";

const TABS = [
	{ id: "edna101", label: "eDNA 101" },
	{ id: "impact", label: "Impact" },
	{ id: "discoveries", label: "Make your own Discoveries" }
] as const;

type SectionId = (typeof TABS)[number]["id"];

interface LearnSectionToggleProps {
	currentSection: SectionId;
}

export default function LearnSectionToggle({ currentSection }: LearnSectionToggleProps) {
	const activeIndex = TABS.findIndex((t) => t.id === currentSection);

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
			{TABS.map((tab) => {
				const isActive = currentSection === tab.id;
				const href = tab.id === "edna101" ? "/learn" : `/learn?section=${tab.id}`;
				return (
					<Link
						key={tab.id}
						href={href}
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
