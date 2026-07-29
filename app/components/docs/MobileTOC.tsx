"use client";

import DocsSections, { DocsGenericSection, DocsPage, DocsSection, PageTitles } from "@/types/docsSections";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, Fragment } from "react";

export default function MobileTOC() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const handleToggle = () => {
		setIsOpen((prev) => !prev);
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	// Effect to handle closing when clicking outside the menu
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
				handleClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Effect to prevent body scroll when the menu is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	return (
		<div className={`lg:hidden mb-6 relative ${isOpen ? "z-scrim" : ""}`} ref={menuRef}>
			{/* The trigger button */}
			<div role="button" className="btn btn-outline w-full justify-between" onClick={handleToggle}>
				<span className="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
					</svg>
					Table of Contents
				</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
				</svg>
			</div>

			{/* The dropdown menu */}
			{isOpen && (
				<ul className="absolute top-full left-0 mt-2 p-6 menu flex flex-col flex-nowrap gap-5 bg-base-100 rounded-box z-raised w-full shadow-lg border border-base-300 max-h-[60vh] overflow-y-auto">
					{Object.entries(DocsSections).map(([page, sections]) => (
						<div key={page} className="flex flex-col gap-2.5">
							<div className="font-bold border-b border-primary pb-1">{PageTitles[page]}</div>

							<div className="pl-3 flex flex-col gap-4">
								{Object.entries(sections).map(([id, sect]: [string, DocsSection]) => (
									<Fragment key={id}>
										<Link
											id={`sidebar-${id}`}
											href={`/docs/${page}/${id}`}
											className={`py-1 cursor-pointer hover:text-primary transition-colors${pathname.split("/").at(-1) === id ? " text-primary" : ""}`}
											onClick={() => setIsOpen(false)}
										>
											{sect.title}
										</Link>

										{sect.subsections ? (
											<div className="text-sm border-l border-base-300 pl-4 flex flex-col gap-2.5">
												{Object.entries(sect.subsections).map(([ssId, ss]) => (
													<Link
														key={ssId}
														id={`sidebar-${ssId}`}
														href={`/docs/${page}/${id}#${ssId}`}
														className="cursor-pointer hover:text-primary transition-colors"
														onClick={() => setIsOpen(false)}
													>
														{ss.title}
													</Link>
												))}
											</div>
										) : (
											<></>
										)}
									</Fragment>
								))}
							</div>
						</div>
					))}
				</ul>
			)}
		</div>
	);
}
