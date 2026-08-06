import { ReactNode } from "react";
import InfoButton from "@/app/components/InfoButton";

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
	const shouldAllowOverflow = allowOverflow;
	const shouldRaiseOnFocus = Boolean(info);

	return (
		<div
			className={[
				"relative isolate flex flex-col rounded-2xl group",
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
				<div className={["flex items-start justify-between gap-4", pad.header, headerClassName].join(" ")}>
					<div className="min-w-0">
						{eyebrow && (
							<div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-base-content/55 mb-1">
								{eyebrow}
							</div>
						)}
						{title && (
							<h3
								className={[
									"text-base sm:text-lg font-semibold leading-tight",
									titleClassName,
									"transition-colors"
								].join(" ")}
							>
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
				className={[pad.body, hasHeader && padding !== "none" ? "pt-3 sm:pt-4" : "", "grow", bodyClassName]
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
		<InfoButton dir="tooltip-bottom" className="z-2200 self-start -translate-y-0.5">
			<div className="space-y-2">
				{info.title ? <div className="text-sm font-semibold text-base-content">{info.title}</div> : null}
				{info.description ? (
					<div className="text-xs text-base-content/75 leading-relaxed">{info.description}</div>
				) : null}
				{info.links && info.links.length > 0 ? (
					<div className="space-y-1.5">
						{info.title || info.description ? <div className="h-px bg-base-content/10" /> : null}
						<ul className="space-y-1 text-xs text-base-content/80">
							{info.links.map((item) => (
								<li key={item.label} className="leading-relaxed">
									{item.href ? (
										<a
											href={item.href}
											target={item.target}
											rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
											className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
										>
											{item.label}
										</a>
									) : (
										<span className="font-medium">{item.label}</span>
									)}
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</InfoButton>
	);
}
