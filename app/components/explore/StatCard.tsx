import { DeadValueEnum } from "@/types/enums";
import Link from "next/link";
import { ReactNode, Suspense } from "react";

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
	className
}: {
	title: string;
	icon?: ReactNode;
	link?: string;
	tooltip?: string;
	layout?: "vertical" | "horizontal";
	className?: string;
} & (
	| { value: number | string; query?: undefined; latitude?: undefined; longitude?: undefined }
	| { value?: undefined; query: () => Promise<number>; latitude?: undefined; longitude?: undefined }
	| { value?: undefined; query?: undefined; latitude: number | null; longitude: number | null }
)) {
	return (
		<Suspense fallback={<SuspenseStatCard title={title} value="..." icon={icon} link={link} layout={layout} />}>
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
	className?: string;
}) {
	let queryVal = value;
	if (query) {
		queryVal = await query();
	}

	let content;
	let innerClassName;
	if (layout === "horizontal" && queryVal !== undefined) {
		innerClassName = " items-center gap-4";
		content = (
			<>
				<div className="w-16 h-16 shrink-0 flex items-center justify-center text-primary">{icon}</div>
				<div className="flex flex-col">
					<div className={`font-bold text-primary${typeof queryVal === "string" ? "" : " text-3xl"}`}>
						{queryVal.toLocaleString()}
					</div>
					<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">{title}</div>
				</div>
			</>
		);
	} else {
		// Vertical centered layout for other cards
		innerClassName = " flex-col items-center text-center";
		content = (
			<>
				{icon && icon !== "eye" && (
					<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">{icon}</div>
				)}
				{queryVal !== undefined && (
					<div className={`font-bold text-primary${typeof queryVal === "string" ? "" : " text-3xl"}`}>
						{queryVal.toLocaleString()}
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
		return (
			<Link href={link} className={className}>
				<div
					className={`bg-base-200 p-4 h-full rounded-lg flex hover:bg-base-300 transition-all duration-300 hover:scale-105 ${innerClassName}${tooltip ? " tooltip tooltip-secondary before:text-primary-content" : ""}`}
					data-tip={tooltip}
				>
					{content}
				</div>
			</Link>
		);
	} else {
		return (
			<div
				className={`bg-base-200 p-4 rounded-lg flex ${innerClassName}${tooltip ? " tooltip tooltip-secondary before:text-primary-content" : ""}${className ? " " + className : ""}`}
				data-tip={tooltip}
			>
				{content}
			</div>
		);
	}
}
