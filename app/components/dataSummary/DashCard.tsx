import { ReactNode } from "react";

export type DashCardMenuItem = {
	label: string;
	href?: string;
	target?: "_blank";
};

/**
 * Rich popover content for the card's triple-dot button. This is rendered
 * as a small info panel (card-in-a-card) instead of a plain dropdown list —
 * it gets a short description paragraph explaining what the card shows,
 * then an optional list of related links at the bottom.
 */
export type DashCardInfo = {
	title?: ReactNode;
	description?: ReactNode;
	links?: DashCardMenuItem[];
};

type Props = {
	eyebrow?: ReactNode;
	title?: ReactNode;
	/** Optional override for the title's text color/weight classes. */
	titleClassName?: string;
	subtitle?: ReactNode;
	action?: ReactNode;
	/** Info popover content for the triple-dot button. */
	info?: DashCardInfo;
	className?: string;
	bodyClassName?: string;
	headerClassName?: string;
	children: ReactNode;
	/** Controls both the header's and the body's inside padding. */
	padding?: "none" | "tight" | "sm" | "md" | "lg";
	/** Allows popovers/menus to escape the card bounds. */
	allowOverflow?: boolean;
};

const padMap: Record<NonNullable<Props["padding"]>, { body: string; header: string }> = {
	none: { body: "", header: "px-5 sm:px-6 pt-4 sm:pt-5" },
	tight: { body: "p-4", header: "p-4 pb-0" },
	sm: { body: "p-4", header: "p-4 pb-0" },
	md: { body: "p-5 sm:p-6", header: "p-5 sm:p-6 pb-0" },
	lg: { body: "p-6 sm:p-8", header: "p-6 sm:p-8 pb-0" }
};

/**
 * Shared card shell for the dashboard / data-summary area.
 *
 * Design rules every card shares:
 *  - Solid bg-base-200 (no diagonal gradient). base-200 is tuned (in
 *    globals.css) to sit just off the page background so cards feel lifted
 *    without any wash.
 *  - Borderless. A gentle drop shadow does the separation work, plus a
 *    hair of inset top highlight for a clean edge.
 *  - Minimal hover state (just a whisper of extra shadow).
 */
export default function DashCard({
	eyebrow,
	title,
	titleClassName = "text-base-content",
	subtitle,
	action,
	info,
	className = "",
	bodyClassName = "",
	headerClassName = "",
	children,
	padding = "md",
	allowOverflow = false
}: Props) {
	const hasHeader = Boolean(eyebrow || title || subtitle || action || info);
	const pad = padMap[padding];
	const shouldAllowOverflow = allowOverflow || Boolean(info);
	const shouldRaiseOnFocus = Boolean(info);

	return (
		<div
			className={[
				"relative isolate flex flex-col rounded-2xl",
				shouldAllowOverflow ? "overflow-visible" : "overflow-hidden",
				shouldRaiseOnFocus ? "focus-within:z-2200" : "",
				"bg-base-200",
				"shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-12px_rgba(0,0,0,0.45),0_1px_3px_-1px_rgba(0,0,0,0.18)]",
				"hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_10px_24px_-14px_rgba(0,0,0,0.5),0_2px_5px_-1px_rgba(0,0,0,0.22)]",
				"transition-shadow duration-300",
				className
			].join(" ")}
		>
			{hasHeader && (
				<div
					className={["flex items-start justify-between gap-4", pad.header, headerClassName].join(" ")}
				>
					<div className="min-w-0">
						{eyebrow && (
							<div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-base-content/55 mb-1">
								{eyebrow}
							</div>
						)}
						{title && (
							<h3 className={["text-base sm:text-lg font-semibold leading-tight", titleClassName].join(" ")}>
								{title}
							</h3>
						)}
						{subtitle && <p className="text-xs sm:text-sm text-base-content/60 mt-1 leading-snug">{subtitle}</p>}
					</div>
					<div className="flex items-center gap-1.5 shrink-0">
						{action}
						{info && <DashCardInfoButton info={info} />}
					</div>
				</div>
			)}
			<div
				className={[
					pad.body,
					hasHeader && padding !== "none" ? "pt-3 sm:pt-4" : "",
					"grow",
					bodyClassName
				]
					.filter(Boolean)
					.join(" ")}
			>
				{children}
			</div>
		</div>
	);
}

/**
 * Triple-dot button that opens a small info popover — a card-in-a-card with
 * a short description paragraph and an optional list of related links.
 * Uses daisyUI's CSS-only focus dropdown so this stays compatible with
 * server components.
 */
export function DashCardInfoButton({ info }: { info: DashCardInfo }) {
	return (
		<div className="dropdown dropdown-end relative z-2200">
			<button
				tabIndex={0}
				type="button"
				className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content focus:text-base-content"
				aria-label="More info about this card"
			>
				<svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
					<circle cx="5" cy="12" r="1.75" />
					<circle cx="12" cy="12" r="1.75" />
					<circle cx="19" cy="12" r="1.75" />
				</svg>
			</button>
			<div
				tabIndex={0}
				className="dropdown-content z-2201 mt-2 w-[min(90vw,24rem)] max-h-[min(75vh,26rem)] overflow-y-auto rounded-md border border-base-300 bg-base-300 p-3 text-base-content shadow-xl"
			>
				{info.title && (
					<div className="text-sm font-semibold text-base-content mb-1">{info.title}</div>
				)}
				{info.description && (
					<p className="text-xs text-base-content/75 leading-relaxed">{info.description}</p>
				)}
				{info.links && info.links.length > 0 && (
					<>
						{(info.title || info.description) && (
							<div className="h-px bg-base-content/10 my-3" />
						)}
						<ul className="flex flex-col gap-0.5">
							{info.links.map((item) => (
								<li key={item.label}>
									{item.href ? (
										<a
											href={item.href}
											target={item.target}
											rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
											className="flex items-center justify-between gap-2 text-xs text-primary hover:text-primary/80 rounded-md px-2 py-1.5 hover:bg-base-200/60 transition-colors"
										>
											<span className="truncate">{item.label}</span>
											<svg
												className="w-3 h-3 shrink-0 opacity-70"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												aria-hidden="true"
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
											</svg>
										</a>
									) : (
										<span className="text-xs text-base-content/70 px-2 py-1.5">{item.label}</span>
									)}
								</li>
							))}
						</ul>
					</>
				)}
			</div>
		</div>
	);
}
