"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { uncapitalizeTable } from "@/app/helpers/utils";

// -----------------------------
// Shared mega-menu primitives
// -----------------------------

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

function unfocusWithoutScrollJump() {
	const el = document.getElementById("unfocusButton");
	if (!el) return;
	const currentX = window.scrollX;
	const currentY = window.scrollY;
	el.focus({ preventScroll: true });
	el.blur();
	window.scrollTo(currentX, currentY);
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
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const isHighlighted = open || isActive;
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		};
	}, []);

	useEffect(() => {
		// Ensure dropdown/backdrop always closes after route transitions.
		setOpen(false);
	}, [pathname]);

	const handleTabLinkClick = useCallback(() => {
		// Close immediately for a clean transition when navigating via the tab label.
		setOpen(false);
		unfocusWithoutScrollJump();
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
			onClick={unfocusWithoutScrollJump}
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
			<Link
				tabIndex={0}
				href={route}
				className={`flex items-center gap-1 px-4 py-2 rounded-t-lg transition-colors ${
					isHighlighted ? "bg-primary text-primary-content" : "hover:bg-base-300"
				} select-none`}
				onClick={handleTabLinkClick}
			>
				<div className="leading-none select-none">{tabName}</div>
				<span
					aria-hidden="true"
					className={`p-1 -mr-1 rounded-md select-none pointer-events-none ${
						isHighlighted ? "text-primary-content" : "text-base-content"
					}`}
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
				</span>
			</Link>

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
					<div className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
						{title}
					</div>
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
			{stats?.length ? (
				<div className="mt-4">
					<div className="space-y-1">
						{stats.map((s) => (
							<div key={s.label} className="flex items-baseline gap-2">
								<div className="text-xl font-semibold text-primary">{s.value}</div>
								<div className="text-xs text-base-content/60">{s.label}</div>
							</div>
						))}
					</div>
				</div>
			) : null}
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
					<div className="text-xs text-base-content/60 mt-1">Filter and sort data in each database table</div>

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

				const nextProjectCount = typeof projectsRes?.count === "number" ? projectsRes.count.toLocaleString() : "—";
				const nextAnalysisCount = typeof analysesRes?.count === "number" ? analysesRes.count.toLocaleString() : "—";

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

export function VisualizeMegaMenu() {
	return (
		<MegaMenu tabName="Visualize" route="/visualize" widthClass="max-w-[640px]">
			<div className="grid grid-cols-[1fr_220px] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/visualize"
						title="Visualize"
						subtitle={
							<>
								<span className="text-primary font-normal">Start here</span>
								<span>, or choose a visualization type below</span>
							</>
						}
						titleClassName="text-base-content group-hover:text-primary"
					/>

					<div className="mt-4 space-y-1">
						<MenuItemWithSubtitle
							href="/visualize/metadata"
							title="Metadata"
							subtitle="Chart and compare sample and analysis metadata."
						/>
						<MenuItemWithSubtitle
							href="/visualize/taxonomy"
							title="Taxonomy"
							subtitle="Explore taxa distributions across projects and analyses."
						/>
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="Switch between metadata and taxonomy charts to compare patterns across the dataset."
					media={
						<div className="relative w-full h-28 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/visualize_mega_menu_light.png"
								alt="Visualize mega menu preview (light mode)"
								fill
								sizes="220px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/visualize_mega_menu_dark.png"
								alt="Visualize mega menu preview (dark mode)"
								fill
								sizes="220px"
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
