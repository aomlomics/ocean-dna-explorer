"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// -----------------------------
// Shared mega-menu primitives
// -----------------------------

const MENU_LINK_PREFETCH = false;

const EXPLORE_LEFT_ITEMS = [
	{ label: "Projects", href: "/explore/project" },
	{ label: "Samples", href: "/explore/sample" },
	{ label: "Assays", href: "/explore/assay" },
	{ label: "AssayPreps", href: "/explore/assayPrep" },
	{ label: "Libraries", href: "/explore/library" }
];

const EXPLORE_RIGHT_ITEMS = [
	{ label: "Analyses", href: "/explore/analysis" },
	{ label: "Occurrences", href: "/explore/occurrence" },
	{ label: "Assignments", href: "/explore/assignment" },
	{ label: "Features", href: "/explore/feature" },
	{ label: "Taxonomies", href: "/explore/taxonomy" }
];

const HELP_ITEMS = [
	{ label: "Overview", href: "/help#node-overview" },
	{ label: "Submit Data", href: "/help#submit" },
	{ label: "Login and Roles", href: "/help#login-and-roles" },
	{ label: "Search", href: "/help#search" },
	{ label: "Visualize", href: "/explore" }
];

const API_ITEMS = [
	{ label: "Introduction", href: "/api#introduction" },
	{ label: "Database Schema", href: "/api#database-schema" },
	{ label: "API Endpoints", href: "/api#api-endpoints" },
	{ label: "Searching & Filtering", href: "/api#searching-and-filtering" },
	{ label: "Query Parameters", href: "/api#query-parameters" }
];

const LEARN_MEGA_MENU_ITEMS: { href: string; title: string; subtitle: string }[] = [
	{
		href: "/learn?section=edna101",
		title: "eDNA 101",
		subtitle: "Discover how eDNA data is created and stored."
	},
	{
		href: "/learn?section=impact",
		title: "Impact",
		subtitle: "How eDNA advances biodiversity science and informs conservation."
	},
	{
		href: "/learn?section=discoveries",
		title: "Make your own Discoveries",
		subtitle: "Tech to match the science, using ODE to make discoveries."
	}
];

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
	panelTopClass,
	/** Nudge the centered panel right (CSS length, e.g. 0.75rem). */
	panelShiftRight,
	/** Place the panel so its right edge sits this many px past the trigger link's right edge (viewport-relative). */
	panelRightBeyondTriggerPx
}: {
	tabName: string;
	route: string;
	activePaths?: string[];
	children: React.ReactNode;
	widthClass: string;
	panelTopClass?: string;
	panelShiftRight?: string;
	panelRightBeyondTriggerPx?: number;
}) {
	const isActive = useIsActive(route, activePaths);
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const triggerRef = useRef<HTMLAnchorElement | null>(null);
	const [panelRightStyle, setPanelRightStyle] = useState<{ right: number } | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const anchorPanelToTrigger =
		typeof panelRightBeyondTriggerPx === "number" && !Number.isNaN(panelRightBeyondTriggerPx);

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		};
	}, []);

	useEffect(() => {
		// Ensure dropdown/backdrop always closes after route transitions.
		setOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!open) return;
		let prevY = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			if (y > prevY) setOpen(false);
			prevY = y;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [open]);

	const updatePanelRightFromTrigger = useCallback(() => {
		if (!anchorPanelToTrigger || !triggerRef.current) return;
		const r = triggerRef.current.getBoundingClientRect();
		const gap = panelRightBeyondTriggerPx ?? 0;
		setPanelRightStyle({ right: Math.round(window.innerWidth - r.right - gap) });
	}, [anchorPanelToTrigger, panelRightBeyondTriggerPx]);

	useLayoutEffect(() => {
		if (!open || !anchorPanelToTrigger) {
			setPanelRightStyle(null);
			return;
		}
		updatePanelRightFromTrigger();
		const onResize = () => updatePanelRightFromTrigger();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [open, anchorPanelToTrigger, updatePanelRightFromTrigger]);

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
		closeTimerRef.current = setTimeout(() => {
			// Guard against ultra-fast cursor movement where enter/leave events can race.
			if (containerRef.current?.matches(":hover")) return;
			setOpen(false);
		}, 120);
	}, []);

	return (
		<div
			ref={containerRef}
			onClick={unfocusWithoutScrollJump}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className="relative z-menu group/menu"
		>
			{open ? (
				<div
					aria-hidden="true"
					className="fixed inset-x-0 bottom-0 top-20 xl:top-24 z-1 pointer-events-none bg-black/30"
				/>
			) : null}

			{/* Trigger — keep hover/open styling subtle and separate from the dropdown panel */}
			<Link
				ref={triggerRef}
				tabIndex={0}
				href={route}
				prefetch={MENU_LINK_PREFETCH}
				className={[
					"relative z-20 flex items-center gap-1 px-2.5 min-[1400px]:px-4 py-2 transition-colors text-sm min-[1400px]:text-lg select-none rounded-t-xl",
					isActive ? "bg-primary text-primary-content" : open ? "bg-base-300" : "hover:bg-base-300"
				].join(" ")}
				onClick={handleTabLinkClick}
			>
				<div className="select-none">{tabName}</div>
				<span
					aria-hidden="true"
					className={`p-1 -mr-1 rounded-md select-none pointer-events-none ${
						isActive ? "text-primary-content" : "text-base-content"
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
			{open ? (
				<div
					tabIndex={0}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					// Fixed + centered so it never gets cut off. We keep the hover area contiguous by making this element
					// include the "gap" using a negative margin + padding "hover bridge", while the actual visible panel sits below.
					className={[
						"z-5",
						"fixed",
						anchorPanelToTrigger ? "left-auto" : "left-1/2",
						anchorPanelToTrigger ? "" : panelShiftRight ? "" : "-translate-x-1/2",
						panelTopClass ?? "top-20 xl:top-24", // matches header heights (h-20 / xl:h-24)
						"-mt-3 pt-3", // hover bridge: extend hit area upward without visually moving panel
						"w-[calc(100vw-2rem)]",
						widthClass
					].join(" ")}
					style={
						anchorPanelToTrigger && panelRightStyle
							? { right: panelRightStyle.right }
							: panelShiftRight
								? { transform: `translateX(calc(-50% + ${panelShiftRight}))` }
								: undefined
					}
				>
					<div className="-mt-1 bg-base-100 rounded-t-none rounded-b-xl border border-base-200/70 shadow-[0_10px_24px_rgba(15,23,42,0.12)] [html[data-theme='dark']_&]:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
						<div className="overflow-hidden rounded-t-none rounded-b-xl">{children}</div>
					</div>
				</div>
			) : null}
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
		<Link href={href} prefetch={MENU_LINK_PREFETCH} className="flex items-start gap-2 group">
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
				<span className="block text-sm text-base-content/55">{subtitle}</span>
			</span>
		</Link>
	);
}

function MenuItem({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			prefetch={MENU_LINK_PREFETCH}
			className="block py-1 px-2 text-base text-base-content/80 hover:text-primary hover:bg-base-200/60 rounded-md"
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
		<Link href={href} prefetch={MENU_LINK_PREFETCH} className="group block rounded-lg px-2 py-2 hover:bg-base-200/60">
			<div className="flex items-start gap-2">
				{icon ? <span className="mt-0.5 text-base-content/70 group-hover:text-primary">{icon}</span> : null}
				<span>
					<div className="text-base font-semibold text-base-content group-hover:text-primary">{title}</div>
					<div className="text-sm text-base-content/55 mt-0.5 leading-snug">{subtitle}</div>
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
				{title ? <div className="text-base font-semibold text-base-content">{title}</div> : null}
				<div className="text-sm text-base-content/60 mt-2 leading-relaxed">{description}</div>
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
	const totalTables = EXPLORE_LEFT_ITEMS.length + EXPLORE_RIGHT_ITEMS.length;

	return (
		<MegaMenu tabName="Explore" route="/explore" widthClass="max-w-[51.25rem]">
			<div className="grid grid-cols-[1fr_17.5rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<div className="text-base font-semibold text-base-content">Explore</div>
					<div className="text-sm text-base-content/60 mt-1">Filter and sort data in each database table</div>

					<div className="mt-4 grid grid-cols-2 gap-4">
						<div className="space-y-1">
							{EXPLORE_LEFT_ITEMS.map((i) => (
								<MenuItem key={i.label} href={i.href} label={i.label} />
							))}
						</div>
						<div className="space-y-1">
							{EXPLORE_RIGHT_ITEMS.map((i) => (
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
								src="/images/taxonomy_explore_mega_menu_light.webp"
								alt="Taxonomy explore preview (light mode)"
								fill
								sizes="280px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
								quality={80}
							/>
							<Image
								src="/images/taxonomy_explore_mega_menu_dark.webp"
								alt="Taxonomy explore preview (dark mode)"
								fill
								sizes="280px"
								className="object-cover object-center hidden [html[data-theme='dark']_&]:block"
								priority={false}
								quality={80}
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
	return (
		<MegaMenu tabName="Docs" route="/help" activePaths={["/help", "/api"]} widthClass="max-w-[48rem]">
			<div className="grid grid-cols-[1fr_1fr_17.5rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/help"
						title="Help"
						subtitle="Documentation & guides"
						titleClassName="text-base-content group-hover:text-primary"
					/>
					<div className="mt-4 space-y-1">
						{HELP_ITEMS.map((i) => (
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
						{API_ITEMS.map((i) => (
							<MenuItem key={i.label} href={i.href} label={i.label} />
						))}
					</div>
				</div>

				<MiniFeatureCard
					title="Become an ODE pro"
					description="Walk through the basics, learn the workflows and data formats, and get comfortable exploring datasets and using the API."
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/docs_mega_menu_light.webp"
								alt="Docs mega menu preview (light mode)"
								fill
								sizes="280px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
								quality={80}
							/>
							<Image
								src="/images/docs_mega_menu_dark.webp"
								alt="Docs mega menu preview (dark mode)"
								fill
								sizes="280px"
								className="object-cover object-center hidden [html[data-theme='dark']_&]:block"
								priority={false}
								quality={80}
							/>
						</div>
					}
				/>
			</div>
		</MegaMenu>
	);
}

export function LearnMegaMenu() {
	return (
		<MegaMenu tabName="Learn" route="/learn" widthClass="max-w-[48rem]" panelRightBeyondTriggerPx={28}>
			<div className="grid grid-cols-[1fr_17.5rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/learn"
						title="Learn"
						subtitle={
							<>
								<span className="text-primary font-normal">Start here</span>
								<span>, or open a section below</span>
							</>
						}
						titleClassName="text-base-content group-hover:text-primary"
					/>

					<div className="mt-4 space-y-1">
						{LEARN_MEGA_MENU_ITEMS.map((i) => (
							<MenuItemWithSubtitle key={i.href} href={i.href} title={i.title} subtitle={i.subtitle} />
						))}
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="Learn about the data stored on ODE, about eDNA and its impact, and how to make discoveries with the data."
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/learn_page_mega_menu_light.webp"
								alt="Learn mega menu preview (light mode)"
								fill
								sizes="280px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
								quality={80}
							/>
							<Image
								src="/images/learn_page_mega_menu_dark.webp"
								alt="Learn mega menu preview (dark mode)"
								fill
								sizes="280px"
								className="object-cover object-center hidden [html[data-theme='dark']_&]:block"
								priority={false}
								quality={80}
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
					fetch("/api/project/count").then((r) => r.json()),
					fetch("/api/analysis/count").then((r) => r.json())
				]);

				if (!cancelled) {
					setProjectCount(projectsRes.result);
					setAnalysisCount(analysesRes.result);
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
		<MegaMenu tabName="Submit" route="/submit" widthClass="max-w-[48rem]">
			<div className="grid grid-cols-[1fr_16rem] gap-0">
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
		<MegaMenu tabName="Visualize" route="/visualize" widthClass="max-w-[48rem]">
			<div className="grid grid-cols-[1fr_16rem] gap-0">
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
							subtitle="Explore taxa distributions from all of our data."
						/>
						<MenuItemWithSubtitle
							href="/visualize/alphaDiversity"
							title="Alpha Diversity"
							subtitle="See Alpha Diversity metrics across analyses."
						/>
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="Switch between metadata and taxonomy charts to compare patterns across the dataset."
					media={
						<div className="relative w-full h-28 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/visualize_mega_menu_light.webp"
								alt="Visualize mega menu preview (light mode)"
								fill
								sizes="220px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
								quality={80}
							/>
							<Image
								src="/images/visualize_mega_menu_dark.webp"
								alt="Visualize mega menu preview (dark mode)"
								fill
								sizes="220px"
								className="object-cover object-center hidden [html[data-theme='dark']_&]:block"
								priority={false}
								quality={80}
							/>
						</div>
					}
				/>
			</div>
		</MegaMenu>
	);
}
