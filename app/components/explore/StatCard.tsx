import { DeadValueEnum } from "@/types/enums";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

export default function StatCard({
	title,
	value,
	query,
	latitude,
	longitude,
	icon,
	link,
	tooltip,
	layout = "vertical",
	/** Horizontal layout only: hug contents (narrow card). Default stretches in grid/flex parents. */
	horizontalCardWidth = "fill",
	className
}: {
	title: string;
	icon?: ReactNode;
	link?: string;
	tooltip?: string;
	layout?: "vertical" | "horizontal";
	horizontalCardWidth?: "fill" | "hug";
	className?: string;
} & (
	| { value: number | string; query?: undefined; latitude?: undefined; longitude?: undefined }
	| { value?: undefined; query: () => Promise<number>; latitude?: undefined; longitude?: undefined }
	| { value?: undefined; query?: undefined; latitude: number | null; longitude: number | null }
)) {
	return (
		<Suspense
			fallback={
				<SuspenseStatCard
					title={title}
					value="..."
					icon={icon}
					link={link}
					layout={layout}
					horizontalCardWidth={horizontalCardWidth}
				/>
			}
		>
			<SuspenseStatCard
				title={title}
				value={value}
				query={query}
				latitude={latitude}
				longitude={longitude}
				icon={icon}
				link={link}
				tooltip={tooltip}
				layout={layout}
				horizontalCardWidth={horizontalCardWidth}
				className={className}
			/>
		</Suspense>
	);
}

async function SuspenseStatCard({
	title,
	value,
	query,
	latitude,
	longitude,
	icon,
	link,
	tooltip,
	layout = "vertical",
	horizontalCardWidth = "fill",
	className
}: {
	title: string;
	value?: number | string;
	query?: () => Promise<number>;
	latitude?: number | null;
	longitude?: number | null;
	icon?: ReactNode;
	link?: string;
	tooltip?: string;
	layout?: "vertical" | "horizontal";
	horizontalCardWidth?: "fill" | "hug";
	className?: string;
}) {
	let queryVal = value;
	if (query) {
		queryVal = await query();
	}

	const shouldDefaultToSearchTooltip = typeof link === "string" && link.startsWith("/search?");
	const resolvedTooltip = tooltip ?? (shouldDefaultToSearchTooltip ? "View as Search" : undefined);
	const tooltipClassName = resolvedTooltip
		? "tooltip tooltip-top before:text-base-content before:bg-base-200 before:border before:border-base-content/20"
		: "";

	let content;
	let innerClassName;
	if (layout === "horizontal" && queryVal !== undefined) {
		const hug = horizontalCardWidth === "hug";
		innerClassName = hug
			? " aspect-square flex-col items-center justify-center gap-2 text-center sm:aspect-auto sm:flex-row sm:gap-4 sm:text-left"
			: " aspect-square w-full flex-col items-center justify-center gap-2 text-center sm:aspect-auto sm:flex-row sm:gap-4 sm:text-left";
		content = (
			<>
				<div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center text-primary">{icon}</div>
				<div
					className={
						hug
							? "flex min-w-min flex-col items-center gap-0.5 overflow-visible sm:items-start"
							: "flex min-w-min flex-col items-center gap-0.5 overflow-visible sm:flex-1 sm:items-start"
					}
				>
					<div
						className={`font-bold text-primary tabular-nums leading-none whitespace-nowrap ${typeof queryVal === "string" ? "" : "text-3xl"}`}
					>
						{queryVal}
					</div>
					<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap">
						{title}
					</div>
				</div>
			</>
		);
	} else {
		// Vertical centered layout for other cards
		innerClassName = " aspect-square flex-col items-center justify-center text-center sm:aspect-auto";
		content = (
			<>
				{icon && icon !== "eye" && (
					<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">{icon}</div>
				)}
				{queryVal !== undefined && (
					<div
						className={`font-bold text-primary w-full overflow-hidden ${typeof queryVal === "string" ? "" : "text-3xl"}`}
					>
						{queryVal}
					</div>
				)}
				{latitude !== undefined && longitude !== undefined && (
					<div className="text-base text-primary font-bold">
						{latitude !== null && longitude !== null ? (
							<>
								<div>Lat: {latitude in DeadValueEnum ? DeadValueEnum[latitude] : latitude.toFixed(4)}</div>
								<div>Lon: {longitude in DeadValueEnum ? DeadValueEnum[longitude] : longitude.toFixed(4)}</div>
							</>
						) : (
							<div className="text-base-content/60">N/A</div>
						)}
					</div>
				)}
				<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">{title}</div>
			</>
		);
	}

	if (link) {
		const hug = layout === "horizontal" && horizontalCardWidth === "hug";
		return (
			<Link
				href={link}
				className={[className, hug ? "block w-full sm:w-max sm:max-w-full" : undefined].filter(Boolean).join(" ")}
			>
				<div
					className={`bg-base-200 p-4 ${hug ? "" : "h-full"} rounded-lg flex hover:bg-base-300 transition-all duration-300 hover:scale-105 ${innerClassName} ${tooltipClassName}`}
					data-tip={resolvedTooltip}
				>
					{content}
				</div>
			</Link>
		);
	} else {
		return (
			<div
				className={`bg-base-200 p-4 rounded-lg flex ${innerClassName} ${tooltipClassName} ${className ?? ""}`}
				data-tip={resolvedTooltip}
			>
				{content}
			</div>
		);
	}
}
