"use client";

import DocsSections from "@/types/docsSections";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

// -----------------------------
// Shared mega-menu primitives
// -----------------------------

const MENU_LINK_PREFETCH = false;
const MEGA_MENU_OPEN_DELAY_MS = 60; // Faster open reduces tab-to-tab flicker.
const MEGA_MENU_CLOSE_DELAY_MS = 180; // Slightly slower close smooths hover transitions.

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

const LEARN_MEGA_MENU_ITEMS: { href: string; title: string; subtitle: string }[] = [
	{
		href: "/learn?section=edna101",
		title: "eDNA 101",
		subtitle: "Take the data journey from a sample to an eDNA dataset"
	},
	{
		href: "/learn?section=impact",
		title: "Impact",
		subtitle: "See how eDNA helps biodiversity research and conservation"
	},
	{
		href: "/learn?section=discoveries",
		title: "Make your own Discoveries",
		subtitle: "Leverage ODE's custom exploration features"
	}
];

const SUBMIT_ITEMS = [
	{
		label: "Project",
		href: "/submit/project",
		subtitle: "Attach FAIR eDNA metadata sheets and add other users to your project"
	},
	{
		label: "Analysis",
		href: "/submit/analysis",
		subtitle: "Attach analysis details and raw data for an existing project"
	}
];

const MegaMenuNavigationContext = createContext<(() => void) | null>(null);

function useMegaMenuNavigate() {
	return useContext(MegaMenuNavigationContext);
}

const VISUALIZE_ITEMS = [
	{
		label: "Metadata",
		href: "/visualize/metadata",
		subtitle: "Compare metadata values on charts"
	},
	{
		label: "Taxonomy",
		href: "/visualize/taxonomy",
		subtitle: "Explore taxonomic distributions across datasets"
	},
	{
		label: "Alpha Diversity",
		href: "/visualize/alphaDiversity",
		subtitle: "Calculate alpha diversity metrics on the server"
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
	const [disableCloseAnimation, setDisableCloseAnimation] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const triggerRef = useRef<HTMLAnchorElement | null>(null);
	const [panelRightStyle, setPanelRightStyle] = useState<{ right: number } | null>(null);
	const anchorPanelToTrigger =
		typeof panelRightBeyondTriggerPx === "number" && !Number.isNaN(panelRightBeyondTriggerPx);

	const debouncedOpen = useDebouncedCallback(() => {
		setDisableCloseAnimation(false);
		setOpen(true);
	}, MEGA_MENU_OPEN_DELAY_MS);

	const debouncedClose = useDebouncedCallback(() => {
		// Guard against ultra-fast cursor movement where enter/leave events can race.
		if (containerRef.current?.matches(":hover")) return;
		setOpen(false);
	}, MEGA_MENU_CLOSE_DELAY_MS);

	useEffect(() => {
		return () => {
			debouncedOpen.cancel();
			debouncedClose.cancel();
		};
	}, [debouncedOpen, debouncedClose]);

	useEffect(() => {
		// Ensure dropdown/backdrop always closes after route transitions.
		debouncedOpen.cancel();
		debouncedClose.cancel();
		setDisableCloseAnimation(false);
		setOpen(false);
	}, [debouncedOpen, debouncedClose, pathname]);

	useEffect(() => {
		if (!open) return;
		let prevY = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			if (y > prevY) {
				debouncedOpen.cancel();
				debouncedClose.cancel();
				setOpen(false);
			}
			prevY = y;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [debouncedOpen, debouncedClose, open]);

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

	const closeImmediatelyForNavigation = useCallback(() => {
		debouncedOpen.cancel();
		debouncedClose.cancel();
		setDisableCloseAnimation(true);
		setOpen(false);
		unfocusWithoutScrollJump();
	}, [debouncedOpen, debouncedClose]);

	const handleTabLinkClick = useCallback(() => {
		// Close immediately for a clean transition when navigating via the tab label.
		closeImmediatelyForNavigation();
	}, [closeImmediatelyForNavigation]);

	const handleMouseEnter = useCallback(() => {
		debouncedClose.cancel();
		setDisableCloseAnimation(false);
		debouncedOpen();
	}, [debouncedClose, debouncedOpen]);

	const handleMouseLeave = useCallback(() => {
		// Small delay so slow mouse movement doesn't collapse the menu.
		// We also add a "hover bridge" in the panel container so there isn't a dead-zone.
		debouncedOpen.cancel();
		debouncedClose();
	}, [debouncedClose, debouncedOpen]);

	return (
		<div
			ref={containerRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className="relative z-menu group/menu"
		>
			<div
				aria-hidden="true"
				className={[
					"fixed inset-x-0 bottom-0 top-20 xl:top-24 z-1 pointer-events-none bg-black/25",
					"transition-opacity ease-out",
					disableCloseAnimation ? "duration-0" : "duration-200",
					open ? "opacity-100" : "opacity-0"
				].join(" ")}
			/>

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
			<div
				tabIndex={open ? 0 : -1}
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
					"transition-[opacity,visibility] ease-out",
					disableCloseAnimation ? "duration-0" : "duration-200",
					open ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none",
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
					<div className="overflow-hidden rounded-t-none rounded-b-xl">
						<MegaMenuNavigationContext.Provider value={closeImmediatelyForNavigation}>
							{children}
						</MegaMenuNavigationContext.Provider>
					</div>
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
	const closeMegaMenuForNavigation = useMegaMenuNavigate();
	return (
		<Link
			href={href}
			prefetch={MENU_LINK_PREFETCH}
			onClick={closeMegaMenuForNavigation ?? undefined}
			className="flex items-start gap-2 group"
		>
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
	const closeMegaMenuForNavigation = useMegaMenuNavigate();
	return (
		<Link
			href={href}
			prefetch={MENU_LINK_PREFETCH}
			onClick={closeMegaMenuForNavigation ?? undefined}
			className="block py-1 px-2 text-base text-base-content/80 hover:text-primary hover:bg-base-200/60 rounded-md"
		>
			{label}
		</Link>
	);
}

function MenuItemWithTinySubtitle({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
	const closeMegaMenuForNavigation = useMegaMenuNavigate();
	return (
		<Link
			href={href}
			prefetch={MENU_LINK_PREFETCH}
			onClick={closeMegaMenuForNavigation ?? undefined}
			className="group block rounded-md px-2 py-1.5 hover:bg-base-200/60"
		>
			<div className="text-base text-base-content/80 transition-colors group-hover:text-primary">{title}</div>
			<div className="mt-0.5 text-xs leading-snug text-base-content/55">{subtitle}</div>
		</Link>
	);
}

function MiniFeatureCard({
	title,
	description,
	stats,
	media,
	statsInline
}: {
	title: string;
	description: string;
	stats?: { value: string; label: string }[];
	media?: React.ReactNode;
	statsInline?: boolean;
}) {
	const hasMedia = Boolean(media);
	const hasStats = Boolean(stats?.length);

	return (
		<div
			className={[
				"p-5 bg-base-200/35 border-l border-base-200 flex flex-col",
				hasStats ? "justify-between" : "justify-center",
				hasMedia ? "items-center" : ""
			].join(" ")}
		>
			<div className={hasMedia ? "w-full max-w-56 text-left" : ""}>
				{media ? <div className={hasStats ? "mb-2" : "mb-3"}>{media}</div> : null}
				{title ? <div className="text-base font-semibold text-base-content">{title}</div> : null}
				<div className={["text-sm text-base-content/60 leading-relaxed", hasStats ? "mt-1" : "mt-2"].join(" ")}>
					{description}
				</div>
			</div>
			{stats?.length ? (
				<div className="mt-3 w-full">
					{statsInline ? (
						<div className="grid grid-cols-2 gap-4">
							{stats.map((s) => (
								<div key={s.label}>
									<div className="text-xl font-semibold text-primary leading-none">{s.value}</div>
									<div className="text-xs text-base-content/60 mt-1">{s.label}</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-1">
							{stats.map((s) => (
								<div key={s.label} className="flex items-baseline gap-2">
									<div className="text-xl font-semibold text-primary">{s.value}</div>
									<div className="text-xs text-base-content/60">{s.label}</div>
								</div>
							))}
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}

export function ExploreMegaMenu() {
	const totalTables = EXPLORE_LEFT_ITEMS.length + EXPLORE_RIGHT_ITEMS.length;

	return (
		<MegaMenu tabName="Explore" route="/explore" widthClass="max-w-[45.5rem]">
			<div className="grid grid-cols-[1fr_15rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/explore"
						title="Explore"
						subtitle="Browse the data with filtering and sorting"
						titleClassName="text-base-content group-hover:text-primary"
					/>

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
					description="Explore table records with filters, sorting, and detailed row views"
					stats={[{ value: `${totalTables}`, label: "tables" }]}
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/taxonomy_explore_mega_menu_light.webp"
								alt="Taxonomy explore preview (light mode)"
								fill
								sizes="240px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/taxonomy_explore_mega_menu_dark.webp"
								alt="Taxonomy explore preview (dark mode)"
								fill
								sizes="240px"
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
	return (
		<MegaMenu tabName="Docs" route="/docs" activePaths={["/docs"]} widthClass="max-w-[45.5rem]">
			<div className="grid grid-cols-[1fr_1fr_15rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/docs/help"
						title="Help"
						subtitle="Documentation & guides"
						titleClassName="text-base-content group-hover:text-primary"
					/>
					<div className="mt-4 space-y-1">
						{Object.entries(DocsSections.help).map(([id, sect]) => (
							<MenuItem key={id} href={`/docs/help/${id}`} label={sect.title} />
						))}
					</div>
				</div>

				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/docs/api"
						title="API"
						subtitle="Programmatic access"
						titleClassName="text-base-content group-hover:text-primary"
					/>
					<div className="mt-4 space-y-1">
						{Object.entries(DocsSections.api).map(([id, sect]) => (
							<MenuItem key={id} href={`/docs/api/${id}`} label={sect.title} />
						))}
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="Thorough documentation written with care"
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/docs_mega_menu_light.webp"
								alt="Docs mega menu preview (light mode)"
								fill
								sizes="240px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/docs_mega_menu_dark.webp"
								alt="Docs mega menu preview (dark mode)"
								fill
								sizes="240px"
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

export function LearnMegaMenu() {
	return (
		<MegaMenu tabName="Learn" route="/learn" widthClass="max-w-[43rem]" panelRightBeyondTriggerPx={28}>
			<div className="grid grid-cols-[1fr_15rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/learn"
						title="Learn"
						subtitle="Discover how eDNA data is created, stored, and analyzed"
						titleClassName="text-base-content group-hover:text-primary"
					/>

					<div className="mt-4 space-y-1">
						{LEARN_MEGA_MENU_ITEMS.map((i) => (
							<MenuItemWithTinySubtitle key={i.href} href={i.href} title={i.title} subtitle={i.subtitle} />
						))}
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="Learn about how eDNA data is created, why eDNA matters, and how it can be analyzed"
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/learn_page_mega_menu_light.webp"
								alt="Learn mega menu preview (light mode)"
								fill
								sizes="240px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/learn_page_mega_menu_dark.webp"
								alt="Learn mega menu preview (dark mode)"
								fill
								sizes="240px"
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
		<MegaMenu tabName="Submit" route="/submit" widthClass="max-w-[41.5rem]">
			<div className="grid grid-cols-[1fr_15rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/submit"
						title="Submit"
						subtitle="Upload your data"
						titleClassName="text-base-content group-hover:text-primary"
					/>

					<div className="mt-4 space-y-1">
						{SUBMIT_ITEMS.map((i) => (
							<MenuItemWithTinySubtitle key={i.label} href={i.href} title={i.label} subtitle={i.subtitle} />
						))}
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="Contributor permission required. Submit projects or individual analyses"
					stats={[
						{ value: projectCount, label: "projects" },
						{ value: analysisCount, label: "analyses" }
					]}
					statsInline
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/submit_mega_menu_light.webp"
								alt="Submit mega menu preview (light mode)"
								fill
								sizes="240px"
								className="object-cover object-top-left origin-top-left scale-[1.3] [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/submit_mega_menu_dark.webp"
								alt="Submit mega menu preview (dark mode)"
								fill
								sizes="240px"
								className="object-cover object-top-left origin-top-left scale-[1.3] hidden [html[data-theme='dark']_&]:block"
								priority={false}
							/>
						</div>
					}
				/>
			</div>
		</MegaMenu>
	);
}

export function VisualizeMegaMenu() {
	return (
		<MegaMenu tabName="Visualize" route="/visualize" widthClass="max-w-[41.5rem]">
			<div className="grid grid-cols-[1fr_15rem] gap-0">
				<div className="p-5 border-r border-base-200">
					<MenuSectionHeader
						href="/visualize"
						title="Visualize"
						subtitle="Build charts directly in your browser"
						titleClassName="text-base-content group-hover:text-primary"
					/>

					<div className="mt-4 space-y-1">
						{VISUALIZE_ITEMS.map((i) => (
							<MenuItemWithTinySubtitle key={i.label} href={i.href} title={i.label} subtitle={i.subtitle} />
						))}
					</div>
				</div>

				<MiniFeatureCard
					title=""
					description="Switch between chart views to compare sample and taxonomy patterns"
					media={
						<div className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-base-200">
							<Image
								src="/images/visualize_mega_menu_light.webp"
								alt="Visualize mega menu preview (light mode)"
								fill
								sizes="240px"
								className="object-cover object-center [html[data-theme='dark']_&]:hidden"
								priority={false}
							/>
							<Image
								src="/images/visualize_mega_menu_dark.webp"
								alt="Visualize mega menu preview (dark mode)"
								fill
								sizes="240px"
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
