"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";
import DocsSections from "@/types/docsSections";

export default function MobileMenu() {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	function handleToggle() {
		setIsOpen((prev) => !prev);
	}

	function handleClose() {
		setIsOpen(false);
	}

	// Close when clicking outside the menu.
	useEffect(() => {
		if (!isOpen) return;

		function handleClickOutside(event: MouseEvent) {
			const menu = menuRef.current;

			if (menu && !menu.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Prevent the page from scrolling while the menu is open.
	useEffect(() => {
		if (!isOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				className="btn btn-ghost lg:hidden p-1 sm:p-2"
				onClick={handleToggle}
				aria-expanded={isOpen}
				aria-label="Toggle navigation menu"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
				</svg>
			</button>

			{isOpen && (
				<ul className="absolute top-full left-0 mt-2 menu bg-base-100 rounded-box z-menu w-72 max-w-[calc(100vw-1rem)] p-3 shadow-lg">
					<li className="text-base py-1">
						<Link href="/" onClick={handleClose}>
							Home
						</Link>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Explore</summary>
							<ul className="w-full max-w-full p-2">
								{DataTableNames.map((table) => (
									<li key={table} className="py-1">
										<Link
											href={`/explore/${table}`}
											onClick={handleClose}
											className="whitespace-normal wrap-break-word"
										>
											{TableMetadata[table].plural}
										</Link>
									</li>
								))}
							</ul>
						</details>
					</li>
					<li className="text-base py-1">
						<Link href="/search" onClick={handleClose}>
							Search
						</Link>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Visualize</summary>
							<ul className="w-full max-w-full p-2">
								<li className="py-1">
									<Link href="/visualize/metadata" onClick={handleClose}>
										Metadata
									</Link>
								</li>
								<li className="py-1">
									<Link href="/visualize/taxonomy" onClick={handleClose}>
										Taxonomy
									</Link>
								</li>
								<li className="py-1">
									<Link href="/visualize/alphaDiversity" onClick={handleClose}>
										Alpha Diversity
									</Link>
								</li>
							</ul>
						</details>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Submit</summary>
							<ul className="w-full max-w-full p-2">
								<li className="py-1">
									<Link href="/submit/project" onClick={handleClose}>
										Project
									</Link>
								</li>
								<li className="py-1">
									<Link href="/submit/analysis" onClick={handleClose}>
										Analysis
									</Link>
								</li>
							</ul>
						</details>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Docs</summary>
							<ul className="w-full max-w-full p-2">
								<li className="py-1">
									<Link href={`/docs/help/${Object.keys(DocsSections.help)[0]}`} onClick={handleClose}>
										Help
									</Link>
								</li>
								<li className="py-1">
									<Link href={`/docs/api/${Object.keys(DocsSections.api)[0]}`} onClick={handleClose}>
										API
									</Link>
								</li>
							</ul>
						</details>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Learn</summary>
							<ul className="w-full max-w-full p-2">
								<li className="py-1">
									<Link
										href="/learn/edna101"
										onClick={handleClose}
										className="whitespace-normal wrap-break-word"
									>
										eDNA 101
									</Link>
								</li>
								<li className="py-1">
									<Link
										href="/learn/impact"
										onClick={handleClose}
										className="whitespace-normal wrap-break-word"
									>
										Impact
									</Link>
								</li>
								<li className="py-1">
									<Link
										href="/learn/discoveries"
										onClick={handleClose}
										className="whitespace-normal wrap-break-word"
									>
										Make your own Discoveries
									</Link>
								</li>
							</ul>
						</details>
					</li>
					<li className="text-base py-1">
						<Link href="/about" onClick={handleClose}>
							About
						</Link>
					</li>
				</ul>
			)}

			{isOpen &&
				createPortal(
					<div className="fixed inset-0 bg-black/30 z-scrim" onClick={handleClose} aria-hidden="true" />,
					document.body
				)}
		</div>
	);
}
