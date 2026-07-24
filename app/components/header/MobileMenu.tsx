"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";

export default function MobileMenu() {
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
		<div className="relative" ref={menuRef}>
			{/* The trigger button */}
			<div role="button" className="btn btn-ghost lg:hidden p-1 sm:p-2" onClick={handleToggle}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
				</svg>
			</div>

			{/* The dropdown menu */}
			{isOpen && (
				<ul className="absolute top-full left-0 mt-2 menu bg-base-100 rounded-box z-menu w-60 p-3 shadow-lg">
					<li className="text-base py-1">
						<Link href="/" onClick={handleClose}>
							Home
						</Link>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Explore</summary>
							<ul className="p-2">
								{DataTableNames.map((table) => (
									<li key={table} className="py-1">
										<Link href={`/explore/${table}`} onClick={handleClose}>
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
							<ul className="p-2">
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
							</ul>
						</details>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Submit</summary>
							<ul className="p-2">
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
					{/* <li className="text-base py-1">
						<Link href="/contribute" onClick={handleClose}>
							Contribute
						</Link>
					</li> */}
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Docs</summary>
							<ul className="p-2">
								<li className="py-1">
									<Link href="/help" onClick={handleClose}>
										Help
									</Link>
								</li>
								<li className="py-1">
									<Link href="/api" onClick={handleClose}>
										API
									</Link>
								</li>
							</ul>
						</details>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Learn</summary>
							<ul className="p-2">
								<li className="py-1">
									<Link href="/learn?section=edna101" onClick={handleClose}>
										eDNA 101
									</Link>
								</li>
								<li className="py-1">
									<Link href="/learn?section=impact" onClick={handleClose}>
										Impact
									</Link>
								</li>
								<li className="py-1">
									<Link href="/learn?section=discoveries" onClick={handleClose}>
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

			{/* The backdrop, rendered into the body via a portal */}
			{mounted &&
				isOpen &&
				createPortal(<div className="fixed inset-0 bg-black/30 z-scrim" onClick={handleClose}></div>, document.body)}
		</div>
	);
}
