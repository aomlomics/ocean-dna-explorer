"use client";

import DocsSections, { DocsSection, DocsPageTitles, DocsPage, DocsGenericSection } from "@/types/docsSections";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, Fragment } from "react";

export default function MobileTOC() {
	const pathname = usePathname();
	const splitPath = pathname.split("/");
	const page = splitPath[2] as DocsPage;
	const section = splitPath[3] as DocsGenericSection<DocsPage>;

	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const router = useRouter();

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
			<div className="flex justify-center pb-5 gap-5">
				<div className={page === "help" ? "text-primary" : "text-base-content/50"}>Help</div>
				<input
					type="checkbox"
					defaultChecked={page === "api"}
					className="toggle border-primary-content text-primary-content"
					onChange={(e) =>
						router.push(
							e.currentTarget.checked
								? `/docs/api/${Object.keys(DocsSections.api)[0]}`
								: `/docs/help/${Object.keys(DocsSections.help)[0]}`
						)
					}
				/>
				<div className={page === "api" ? "text-primary" : "text-base-content/50"}>API</div>
			</div>

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
				<ul className="absolute top-full left-0 mt-2 px-6 py-4 menu flex flex-col flex-nowrap gap-5 bg-base-100 rounded-box z-raised w-full shadow-lg border border-base-300 max-h-[60vh] overflow-y-auto">
					{Object.entries(DocsSections[page]).map(([id, sect]: [string, DocsSection]) => (
						<Fragment key={id}>
							<Link
								id={`sidebar-${id}`}
								href={`/docs/${page}/${id}`}
								className={`py-1 cursor-pointer hover:text-primary transition-colors${section === id ? " text-primary" : ""}`}
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
				</ul>
			)}
		</div>
	);
}
