"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type Section = {
	id: string;
	title: string;
	subsections?: Array<{
		id: string;
		title: string;
	}>;
};

export default function MobileTOC({ sections }: { sections: Section[] }) {
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

	// Ensure the component is mounted before trying to use the portal
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	return (
		<div className={`lg:hidden mb-6 relative ${isOpen ? "z-40" : ""}`} ref={menuRef}>
			{/* The trigger button */}
			<div role="button" className="btn btn-outline w-full justify-between" onClick={handleToggle}>
				<span className="flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
				<ul className="absolute top-full left-0 mt-2 menu flex flex-col flex-nowrap gap-5 bg-base-100 rounded-box z-[51] w-full p-2 shadow-lg border border-base-300 max-h-[60vh] overflow-y-auto">
					{sections.map((section, index) => {
						const hasSubs = Boolean(section.subsections?.length);
						return (
							<li key={section.id} className="w-full">
								<div className={`flex flex-col ${hasSubs ? "gap-2.5" : "gap-0"}`}>
									<a
										href={`#${section.id}`}
										className="block w-full px-2 py-1 hover:text-primary transition-colors font-medium whitespace-normal break-words"
										data-section-index={index}
										onClick={handleClose}
									>
										{section.title}
									</a>
									{hasSubs && section.subsections && (
										<ul className="ml-4 space-y-1 border-l border-base-300 pl-2">
											{section.subsections.map((subsection) => (
												<li key={subsection.id} className="w-full">
													<a
														href={`#${subsection.id}`}
														data-toc-target={subsection.id}
														className="block w-full py-1 px-2 text-sm hover:text-primary transition-colors whitespace-normal break-words"
														onClick={handleClose}
													>
														{subsection.title}
													</a>
												</li>
											))}
										</ul>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}

			{/* The backdrop, rendered into the body via a portal */}
			{mounted &&
				isOpen &&
				createPortal(
					<div
						className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-30"
						onClick={handleClose}
					></div>,
					document.body
				)}
		</div>
	);
} 