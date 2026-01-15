"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { uncapitalizeTable } from "@/app/helpers/utils";

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
			<div role="button" className="btn btn-ghost xl:hidden p-1 sm:p-2" onClick={handleToggle}>
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
				<ul className="absolute top-full left-0 mt-2 menu bg-base-100 rounded-box z-50 w-60 p-3 shadow-lg">
					<li className="text-base py-1">
						<Link href="/" onClick={handleClose}>
							Home
						</Link>
					</li>
					<li className="text-base py-1">
						<details>
							<summary className="text-base">Explore</summary>
							<ul className="p-2">
								{TableNames.map((table) => (
									<li key={table} className="py-1">
										<Link href={`/explore/${uncapitalizeTable(table as Prisma.ModelName)}`} onClick={handleClose}>
											{TableMetadata[table as Prisma.ModelName].plural}
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
						<Link href="/api" onClick={handleClose}>
							API
						</Link>
					</li>
					<li className="text-base py-1">
						<Link href="/help" onClick={handleClose}>
							Help
						</Link>
					</li>
					{/* TEMPORARY: hide the About page until its finished */}
					{/* <li className="text-base py-1">
						<Link href="/about" onClick={handleClose}>
							About
						</Link>
					</li> */}
				</ul>
			)}

			{/* The backdrop, rendered into the body via a portal */}
			{mounted &&
				isOpen &&
				createPortal(
					<div
						className="fixed inset-x-0 bottom-0 top-20 lg:top-24 bg-black/10 backdrop-blur-[2px] z-40"
						onClick={handleClose}
					></div>,
					document.body
				)}
		</div>
	);
}
