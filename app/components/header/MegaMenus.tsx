"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { unfocus, uncapitalizeTable } from "@/app/helpers/utils";

// -----------------------------
// Shared mega-menu primitives
// -----------------------------

function ShipIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 424 169"
			className={className ?? "h-5 w-auto"}
			fill="currentColor"
			stroke="none"
			aria-hidden="true"
		>
			<path d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13 M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0z M419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83 419.95 111.83 419.95 111.83 M173.43,2.11c-2.61,11.17-5.53,22.27-8.47,33.39l-4.5,16.62-2.29,8.29c-.84,2.76-1.14,5.62-3.51,8.02l-1.75-.42c-.79-3.13.48-5.79,1.2-8.56l2.34-8.26,4.86-16.5c3.36-11.01,6.7-22,10.38-33l1.75.42Z M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36Z M276.54,35.11l-1.18-1.38c.56-1.48.85-3.05.85-4.63.05-7.21-5.75-13.09-12.96-13.14-7.21-.05-13.09,5.75-13.14,12.96-.01,1.65.29,3.28.88,4.81l-1.2,1.38,10.23,11.86v54h6.3v-54l10.21-11.86h0Z" />
		</svg>
	);
}

function AnalysisStatIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 1024 1024"
			className={className ?? "w-5 h-5"}
			fill="currentColor"
			stroke="none"
			aria-hidden="true"
		>
			<path
				d="M878.3 152.9H145.7c-38.6 0-70 31.4-70 70V706c0 38.6 31.4 70 70 70h732.6c38.6 0 70-31.4 70-70V222.9c0-38.6-31.4-70-70-70z m30 531V706c0 16.5-13.5 30-30 30H145.7c-16.5 0-30-13.5-30-30V222.9c0-16.5 13.5-30 30-30h732.6c16.5 0 30 13.5 30 30v461zM678 871.1H346c-11 0-20-9-20-20s9-20 20-20h332c11 0 20 9 20 20s-9 20-20 20z"
			/>
			<path d="M127.1 662.7c-2.7 0-5.4-1.1-7.3-3.2-3.7-4.1-3.5-10.4 0.6-14.1l236.5-219.6L463 541.9l258.9-290.7 183.7 196.3c3.8 4 3.6 10.4-0.4 14.1-4 3.8-10.3 3.6-14.1-0.4L722.3 280.8l-259 290.9L355.7 454 133.9 660c-2 1.8-4.4 2.7-6.8 2.7z" />
			<path d="M208.9 541.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
			<path d="M633.4 329.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
			<path d="M748.7 539.6a16.9 17 0 1 0 33.8 0 16.9 17 0 1 0-33.8 0Z" />
		</svg>
	);
}

function useIsActive(route: string, activePaths?: string[]) {
	const pathname = usePathname();
	return useMemo(() => {
		if (activePaths?.length) {
			return activePaths.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "#"));
		}
		if (route === "/") return pathname === "/";
		return pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route + "#");
	}, [activePaths, pathname, route]);
}

function MegaMenu({
	tabName,
	route,
	activePaths,
	children,
	widthClass,
	panelTopClass
}: {
	tabName: string;
	route: string;
	activePaths?: string[];
	children: React.ReactNode;
	widthClass: string;
	panelTopClass?: string;
}) {
	const isActive = useIsActive(route, activePaths);
	const [open, setOpen] = useState(false);
	const isHighlighted = open || isActive;
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		};
	}, []);

	const toggleOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		// Do NOT navigate; just toggle.
		e.preventDefault();
		e.stopPropagation();
		setOpen((v) => !v);
	}, []);

	const handleMouseEnter = useCallback(() => {
		if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		setOpen(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		// Small delay so slow mouse movement doesn't collapse the menu.
		// We also add a "hover bridge" in the panel container so there isn't a dead-zone.
		if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		closeTimerRef.current = setTimeout(() => setOpen(false), 150);
	}, []);

	return (
		<div
			onClick={unfocus}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={`dropdown group/menu ${open ? "dropdown-open" : ""}`}
		>
			{/* Subtle backdrop blur when open (below header) */}
			{open ? (
				<div
					aria-hidden="true"
					// NOTE: backdrop-blur is easiest to notice with a slight translucent fill.
					className="fixed inset-0 top-20 lg:top-24 z-99998 pointer-events-none backdrop-blur-[2px] bg-base-100/10"
				/>
			) : null}

			{/* Trigger */}
			<div
				tabIndex={0}
				className={`flex items-center gap-1 px-4 py-2 rounded-t-lg transition-colors ${
					isHighlighted ? "bg-primary text-primary-content" : "hover:bg-base-300"
				} select-none`}
			>
				<Link href={route} className="leading-none select-none">
					{tabName}
				</Link>
				<button
					type="button"
					aria-label={`Toggle ${tabName} menu`}
					aria-expanded={open}
					className={`p-1 -mr-1 rounded-md select-none ${isHighlighted ? "text-primary-content" : "text-base-content"}`}
					onClick={toggleOpen}
				>
					<svg
						className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${
							open ? "rotate-180" : ""
						} group-hover/menu:rotate-180`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						strokeWidth={2.5}
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
					</svg>
				</button>
			</div>

			{/* Panel */}
			<div
				tabIndex={0}
				// Fixed + centered so it never gets cut off. We keep the hover area contiguous by making this element
				// include the "gap" using a negative margin + padding "hover bridge", while the actual visible panel sits below.
				className={[
					"dropdown-content z-99999",
					"fixed left-1/2 -translate-x-1/2",
					panelTopClass ?? "top-20 lg:top-24", // matches header heights (h-20 / lg:h-24)
					"-mt-3 pt-3", // hover bridge: extend hit area upward without visually moving panel
					"w-[calc(100vw-2rem)]",
					widthClass
				].join(" ")}
			>
				<div className="bg-base-100 rounded-xl shadow-2xl shadow-black/25 border border-base-200 ring-1 ring-base-content/10 overflow-hidden">
					{children}
				</div>
			</div>
		</div>
	);
}

function MenuSectionHeader({
	href,
	title,
	subtitle,
	icon,
	titleClassName
}: {
	href: string;
	title: string;
	subtitle: React.ReactNode;
	icon?: React.ReactNode;
	titleClassName?: string;
}) {
	return (
		<Link href={href} className="flex items-start gap-2 group">
			{icon ? (
				<span className="mt-0.5 text-base-content/70 group-hover:text-primary transition-colors">{icon}</span>
			) : null}
			<span>
				<span
					className={[
						"block text-base font-semibold transition-colors",
						titleClassName ?? "text-primary group-hover:text-primary-focus"
					].join(" ")}
				>
					{title}
				</span>
				<span className="block text-xs text-base-content/55">{subtitle}</span>
			</span>
		</Link>
	);
}

function MenuItem({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			className="block py-1 px-2 text-sm text-base-content/80 hover:text-primary hover:bg-base-200/60 rounded-md transition-colors"
		>
			{label}
		</Link>
	);
}

function MenuItemWithSubtitle({
	href,
	title,
	subtitle,
	icon
}: {
	href: string;
	title: string;
	subtitle: string;
	icon?: React.ReactNode;
}) {
	return (
		<Link href={href} className="group block rounded-lg px-2 py-2 hover:bg-base-200/60 transition-colors">
			<div className="flex items-start gap-2">
				{icon ? (
					<span className="mt-0.5 text-base-content/70 group-hover:text-primary transition-colors">{icon}</span>
				) : null}
				<span>
					<div className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">{title}</div>
					<div className="text-xs text-base-content/55 mt-0.5 leading-snug">{subtitle}</div>
				</span>
			</div>
		</Link>
	);
}

function MiniFeatureCard({
	title,
	description,
	stats,
	media
}: {
	title: string;
	description: string;
	stats?: { value: string; label: string }[];
	media?: React.ReactNode;
}) {
	return (
		<div className="p-5 bg-base-200/35 border-l border-base-200 flex flex-col justify-between">
			<div>
				{media ? <div className="mb-4">{media}</div> : null}
				{title ? <div className="text-sm font-semibold text-base-content">{title}</div> : null}
				<div className="text-xs text-base-content/60 mt-2 leading-relaxed">{description}</div>
			</div>
			<div className="mt-4">
				{stats?.length ? (
					<div className="space-y-1">
						{stats.map((s) => (
							<div key={s.label} className="flex items-baseline gap-2">
								<div className="text-xl font-semibold text-primary">{s.value}</div>
								<div className="text-xs text-base-content/60">{s.label}</div>
							</div>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}

export function ExploreMegaMenu() {
	const leftModels = ["Project", "Sample", "Assay", "AssayPrep", "Library"] as const;
	const rightModels = ["Analysis", "Occurrence", "Assignment", "Feature", "Taxonomy"] as const;

	const leftItems = leftModels.map((m) => {
		const model = m as Prisma.ModelName;
		return {
			label: TableMetadata[model].plural,
			href: `/explore/${uncapitalizeTable(model)}`
		};
	});

	const rightItems = rightModels.map((m) => {
		const model = m as Prisma.ModelName;
		return {
			label: TableMetadata[model].plural,
			href: `/explore/${uncapitalizeTable(model)}`
		};
	});

	const totalTables = leftItems.length + rightItems.length;

	return (
		<MegaMenu tabName="Explore" route="/explore" widthClass="max-w-[820px]">
			<div className="grid grid-cols-[1fr_280px] gap-0">
				<div className="p-5 border-r border-base-200">
					<div className="text-base font-semibold text-base-content">Explore</div>
					<div className="text-xs text-base-content/60 mt-1">
						Filter and sort data in each database table
					</div>

					<div className="mt-4 grid grid-cols-2 gap-4">
						<div className="space-y-1">
							{leftItems.map((i) => (
								<MenuItem key={i.label} href={i.href} label={i.label} />
							))}
						</div>
						<div className="space-y-1">
							{rightItems.map((i) => (
								<MenuItem key={i.label} href={i.href} label={i.label} />
							))}
						</div>
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="View the data in each table of the database separately with filters, sorting, and column searches. Click on a row to view more details."
					stats={[{ value: `${totalTables}`, label: "tables" }]}
					media={
						<div className="relative w-full h-28 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/taxonomy_explore_mega_menu_light.png"
								alt="Taxonomy explore preview (light mode)"
								fill
								sizes="280px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/taxonomy_explore_mega_menu_dark.png"
								alt="Taxonomy explore preview (dark mode)"
								fill
								sizes="280px"
								className="object-cover object-center hidden [html[data-theme='dark']_&]:block"
								priority={false}
							/>
						</div>
					}
				/>
			</div>
		</MegaMenu>
	);
}

// -----------------------------
// Docs Mega Menu (Help/API/Learn)
// -----------------------------

export function DocsMegaMenu() {
	// NOTE: There is no `help#visualize` section in HelpSections currently.
	// Using `/explore` as the closest existing “visualize-like” UI.
	const helpItems = [
		{ label: "Overview", href: "/help#node-overview" },
		{ label: "Login and Roles", href: "/help#login-and-roles" },
		{ label: "Search", href: "/help#search" },
		{ label: "Explore", href: "/help#explore" },
		{ label: "Visualize", href: "/explore" }
	];

	const apiItems = [
		{ label: "Introduction", href: "/api#introduction" },
		{ label: "Database Schema", href: "/api#database-schema" },
		{ label: "API Endpoints", href: "/api#api-endpoints" },
		{ label: "Searching & Filtering", href: "/api#searching-and-filtering" },
		{ label: "Query Parameters", href: "/api#query-parameters" }
	];

	const learnItems = [
		{ label: "What is eDNA?", href: "/learn?section=edna101" },
		{ label: "Impact", href: "/learn?section=impact" },
		{ label: "Make your own scientific discoveries", href: "/learn?section=discoveries" }
	];

	return (
		<MegaMenu tabName="Docs" route="/help" activePaths={["/help", "/learn", "/api"]} widthClass="max-w-[980px]">
			<div className="grid grid-cols-[1fr_1fr_1fr_280px] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/help"
						title="Help"
						subtitle="Documentation & guides"
						titleClassName="text-base-content group-hover:text-primary"
					/>
					<div className="mt-4 space-y-1">
						{helpItems.map((i) => (
							<MenuItem key={i.label} href={i.href} label={i.label} />
						))}
					</div>
				</div>

				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/api"
						title="API"
						subtitle="Programmatic access"
						titleClassName="text-base-content group-hover:text-primary"
					/>
					<div className="mt-4 space-y-1">
						{apiItems.map((i) => (
							<MenuItem key={i.label} href={i.href} label={i.label} />
						))}
					</div>
				</div>

				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/learn"
						title="Learn"
						subtitle="eDNA science & discovery"
						titleClassName="text-base-content group-hover:text-primary"
					/>
					<div className="mt-4 space-y-1">
						{learnItems.map((i) => (
							<MenuItem key={i.label} href={i.href} label={i.label} />
						))}
					</div>
				</div>

				<MiniFeatureCard
					title="Become an eDNA and ODE pro"
					description="Walk through the basics, learn the workflow, and get comfortable exploring real datasets."
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/docs_mega_menu_light.png"
								alt="Docs mega menu preview (light mode)"
								fill
								sizes="280px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/docs_mega_menu_dark.png"
								alt="Docs mega menu preview (dark mode)"
								fill
								sizes="280px"
								className="object-cover object-center hidden [html[data-theme='dark']_&]:block"
								priority={false}
							/>
						</div>
					}
				/>
			</div>
		</MegaMenu>
	);
}

// -----------------------------
// Submit Mega Menu (with graphic)
// -----------------------------

export function SubmitMegaMenu() {
	const [projectCount, setProjectCount] = useState<string>("—");
	const [analysisCount, setAnalysisCount] = useState<string>("—");

	useEffect(() => {
		let cancelled = false;
		async function loadCounts() {
			try {
				const [projectsRes, analysesRes] = await Promise.all([
					fetch("/api/project/pagination?take=1").then((r) => r.json()),
					fetch("/api/analysis/pagination?take=1").then((r) => r.json())
				]);

				const nextProjectCount =
					typeof projectsRes?.count === "number" ? projectsRes.count.toLocaleString() : "—";
				const nextAnalysisCount =
					typeof analysesRes?.count === "number" ? analysesRes.count.toLocaleString() : "—";

				if (!cancelled) {
					setProjectCount(nextProjectCount);
					setAnalysisCount(nextAnalysisCount);
				}
			} catch {
				// Leave placeholders if the request fails.
			}
		}
		loadCounts();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<MegaMenu tabName="Submit" route="/submit" widthClass="max-w-[640px]">
			<div className="grid grid-cols-[1fr_220px] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/submit"
						title="Submit"
						subtitle={
							<>
								<span className="text-primary font-normal">Start here</span>
								<span>, or choose a submission type below</span>
							</>
						}
						titleClassName="text-base-content group-hover:text-primary"
					/>

					<div className="mt-4 space-y-1">
						<MenuItemWithSubtitle
							href="/submit/project"
							title="Project"
							subtitle="Create a project first: metadata, samples, and study design."
						/>
						<MenuItemWithSubtitle
							href="/submit/analysis"
							title="Analysis"
							subtitle="Analyses must be attached to an existing project."
						/>
					</div>
				</div>

				<MiniFeatureCard
					title="Submission tips"
					description="Contributor role required. Choose visibility, tag datasets, and edit metadata later."
					stats={[
						{ value: projectCount, label: "projects" },
						{ value: analysisCount, label: "analyses" }
					]}
				/>
			</div>
		</MegaMenu>
	);
}

