"use client";

import { useState } from "react";
import type { Dispatch, ReactNode, RefObject, SetStateAction, MouseEvent } from "react";
import type { Map } from "leaflet";
import type { Prisma } from "@/app/generated/prisma/client";
import LeafletControl from "./LeafletControl";
import CollapsibleMapContainer from "../containers/CollapsibleMapContainer";
import ResizableMapContainer from "../containers/ResizableMapContainer";
import {
	DEFAULT_COLOR,
	DEFAULT_PALETTE,
	getMapLegendField,
	LEGEND_VALUES_LIMIT,
	type LegendInfo
} from "../utils/mapUtils";
import InfoButton from "../../InfoButton";
import TableMetadata from "@/types/tableMetadata";
import ResetButtonMap from "../utils/ResetButtonMap";
import chroma, { type Color } from "chroma-js";
import Link from "next/link";
import useMapLocations from "../utils/useMapLocations";

export default function LegendControl({
	legend,
	legendInfo,
	setLegendInfo,
	setLoading,
	legendOptions,
	userDefinedOptions,
	mapRef,
	table,
	reducedPoints,
	titleTable,
	defaultLegend
}: {
	legend: boolean;
	legendInfo: LegendInfo;
	setLegendInfo: Dispatch<SetStateAction<LegendInfo>>;
	setLoading: Dispatch<SetStateAction<boolean>>;
	legendOptions: string[];
	userDefinedOptions: Set<string>;
	mapRef: RefObject<Map | null>;
	table: Uncapitalize<Prisma.ModelName>;
	reducedPoints: ReturnType<typeof useMapLocations>["reducedPoints"];
	titleTable?: Uncapitalize<Prisma.ModelName>;
	defaultLegend?: LegendInfo;
}) {
	const [filter, setFilter] = useState("");
	const [shown, setShown] = useState(!!legendInfo);

	if (!legend) {
		return null;
	}

	return (
		<LeafletControl click scroll className="leaflet-bar border-none! mb-6! flex flex-col gap-2">
			<CollapsibleMapContainer hiddenText="Show legend" defaultCollapse={!legendInfo} onCollapse={(c) => setShown(!c)}>
				<ResizableMapContainer
					growDirection={"up"}
					detectChange={[
						shown,
						//spread operator to put nothing when legendInfo doesn't exist
						...(legendInfo
							? typeof legendInfo.field === "string"
								? [legendInfo.field]
								: [legendInfo.field.join("/")]
							: [])
					]}
					mapRef={mapRef}
					maxMinHeight={200}
				>
					<div className="flex flex-col w-full">
						<div className="text-lg flex justify-between items-center gap-2">
							{titleTable ? (
								<InfoButton text={`Clustering on ${TableMetadata[titleTable].titleField}.`} dir="tooltip-left" />
							) : (
								<></>
							)}
							<ResetButtonMap
								disabled={!legendInfo || (!!defaultLegend && defaultLegend.field === legendInfo.field)}
								dataTip="Reset Legend"
								resetFunction={() => setLegendInfo(defaultLegend)}
							/>

							<select
								className="select select-xs select-primary text-sm mr-3 grow min-w-max"
								value={legendInfo?.field ?? ""}
								onChange={async (e) => {
									const field = e.target.value;
									//give control back to browser to display loading
									setLoading(true);
									await new Promise((resolve) => setTimeout(resolve, 1));
									setLegendInfo(getMapLegendField({ field, userDefinedOptions, reducedPoints, table }));
								}}
							>
								<option disabled value="">
									Select field
								</option>
								{legendOptions.map((opt) => (
									<option key={opt} value={opt}>
										{opt}
										{userDefinedOptions.has(opt) && " (UD)"}
									</option>
								))}
							</select>

							{legendInfo && legendInfo.mode === "gradient" ? (
								<div className="dropdown dropdown-top dropdown-end">
									<div tabIndex={0} role="button">
										<svg
											height="20px"
											width="20px"
											version="1.1"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 32 32"
											className="text-primary cursor-pointer"
											stroke="currentColor"
											fill="currentColor"
										>
											<path
												d="M27.7,3.3c-1.5-1.5-3.9-1.5-5.4,0L17,8.6l-1.3-1.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l1.3,1.3L5,20.6
	c-0.6,0.6-1,1.4-1.1,2.3C3.3,23.4,3,24.2,3,25c0,1.7,1.3,3,3,3c0.8,0,1.6-0.3,2.2-0.9C9,27,9.8,26.6,10.4,26L21,15.4l1.3,1.3
	c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L22.4,14l5.3-5.3C29.2,7.2,29.2,4.8,27.7,3.3z M9,24.6
	c-0.4,0.4-0.8,0.6-1.3,0.5c-0.4,0-0.7,0.2-0.9,0.5C6.7,25.8,6.3,26,6,26c-0.6,0-1-0.4-1-1c0-0.3,0.2-0.7,0.5-0.8
	c0.3-0.2,0.5-0.5,0.5-0.9c0-0.5,0.2-1,0.5-1.3L17,11.4l2.6,2.6L9,24.6z"
											/>
										</svg>
									</div>
									<ul
										tabIndex={-1}
										className="dropdown-content menu bg-base-200 rounded-box z-1 w-52 shadow-sm p-2 flex-nowrap"
									>
										<div className="flex gap-2 items-center pb-2">
											<ResetButtonMap
												disabled={legendInfo.palette === DEFAULT_PALETTE}
												dataTip={"Reset to " + DEFAULT_PALETTE}
												resetFunction={() => {
													setLegendInfo({ ...legendInfo, palette: DEFAULT_PALETTE });
													(document.activeElement as HTMLDivElement).blur();
												}}
											/>
											<input
												type="text"
												onChange={(e) => setFilter(e.target.value)}
												value={filter}
												placeholder={`Filter colors`}
												className="input input-primary input-sm w-full flex-1 min-w-0 text-primary py-1"
											/>
										</div>

										<div className="max-h-75 overflow-y-scroll! overscroll-contain flex flex-col gap-2">
											{Object.keys(chroma.brewer)
												.sort()
												.reduce((acc, scaleName) => {
													if (
														scaleName.toLowerCase().includes(filter.toLowerCase()) &&
														scaleName !== legendInfo.palette
													) {
														const scale = chroma.brewer[scaleName as keyof typeof chroma.brewer];
														acc.push(
															<li key={scaleName} className="w-full">
																<a
																	className="w-auto! bg-base-200! flex! items-center justify-center rounded-md! p-1! font-semibold"
																	style={{
																		backgroundImage: `linear-gradient(to right, ${scale.join(",")})`
																	}}
																	onClick={() => {
																		setLegendInfo({ ...legendInfo, palette: scaleName });
																		(document.activeElement as HTMLDivElement).blur();
																	}}
																>
																	{scaleName}
																</a>
															</li>
														);
													}

													return acc;
												}, [] as ReactNode[])}
										</div>
									</ul>
								</div>
							) : (
								<></>
							)}
						</div>

						<div className="flex flex-col ml-1 mr-2 border-t-2 border-primary mt-2 pt-3 pb-2 overflow-y-auto overflow-x-hidden">
							<Legend legendInfo={legendInfo} setLegendInfo={setLegendInfo} />
						</div>
					</div>
				</ResizableMapContainer>
			</CollapsibleMapContainer>
		</LeafletControl>
	);
}

function Legend({
	legendInfo,
	setLegendInfo
}: {
	legendInfo: LegendInfo;
	setLegendInfo: Dispatch<SetStateAction<LegendInfo>>;
}) {
	if (!legendInfo) {
		return <></>;
	}

	if (legendInfo.mode === "gradient") {
		return (
			<div className="flex flex-col items-center">
				<div
					className="w-full flex items-center justify-center rounded-md p-2 tooltip tooltip-secondary before:text-primary-content"
					//TODO: enable tooltip once daisyui overflow bug is fixed
					// data-tip={legendInfo.palette}
					style={{
						backgroundImage: `linear-gradient(to right, ${chroma.brewer[
							legendInfo.palette as keyof typeof chroma.brewer
						].join(",")})`
					}}
				/>
				<div className="flex justify-between w-full">
					{typeof legendInfo.range[0] === "number" ? (
						<>
							<span>{Math.round(legendInfo.range[0] * 1000) / 1000}</span>
							<span>{Math.round((legendInfo.range[1] as number) * 1000) / 1000}</span>
						</>
					) : (
						//TODO: display dates differently depending on distance between dates
						//EG: when dates are at least 2 days apart, displaying them as MM/DD/YYYY is fine
						//when dates are all on the same day, time must be displayed as well
						<>
							<span>{legendInfo.range[0].toLocaleDateString()}</span>
							<span>{(legendInfo.range[1] as Date).toLocaleDateString()}</span>
						</>
					)}
				</div>
				{legendInfo.someNoValue ? (
					//TODO: change color of no value label if palette has red
					<LegendItem value="No value" color={DEFAULT_COLOR} />
				) : (
					<></>
				)}
			</div>
		);
	} else if (legendInfo.mode === "discreet") {
		const colorMapArray = Object.entries(legendInfo.colorMap);
		const table = Object.keys(TableMetadata).find(
			(table) => TableMetadata[table as Prisma.ModelName].titleField === legendInfo.field
		);

		if (colorMapArray.length === 0) {
			return (
				<LegendItem
					value={legendInfo.tooManyOptions ? `Too many values (>${LEGEND_VALUES_LIMIT})` : "No value"}
					color={DEFAULT_COLOR}
				/>
			);
		} else if (colorMapArray.length === 1) {
			const [key, color] = colorMapArray[0]!;

			return <LegendItem value={key} color={color} link={table && `/explore/${table}/${encodeURIComponent(key)}`} />;
		} else {
			return (
				<>
					{colorMapArray.map(([key, color]) => (
						<LegendItem
							key={key}
							value={key}
							color={color}
							link={table && `/explore/${table}/${encodeURIComponent(key)}`}
							onClick={() => {
								if (legendInfo.hidden?.includes(key)) {
									setLegendInfo({
										...legendInfo,
										hidden: legendInfo.hidden?.filter((e) => e !== key)
									});
								} else {
									setLegendInfo({
										...legendInfo,
										hidden: [...(legendInfo.hidden || []), key]
									});
								}
							}}
							hidden={legendInfo.hidden?.includes(key)}
						/>
					))}
				</>
			);
		}
	}
}

function LegendItem({
	value,
	color,
	link,
	onClick,
	hidden
}: {
	value: string;
	color: Color;
	link?: string;
	onClick?: (e: MouseEvent<HTMLDivElement>) => void;
	hidden?: boolean;
}) {
	const colorHex = color.hex();

	const colorIndicator = (
		<div
			className={[
				"relative!",
				"aspect-square!",
				"w-[1em]!",
				"h-[1em]!",
				"shrink-0!",
				"select-none!",
				"overflow-hidden!",
				onClick ? "cursor-pointer!" : ""
			].join(" ")}
			style={{
				backgroundColor: hidden ? color.alpha(0.5).hex() : colorHex
			}}
			onClick={onClick}
			data-tip={onClick && (hidden ? "Show" : "Hide")}
		>
			{hidden && (
				<span
					aria-hidden="true"
					className="absolute! left-1/2! top-1/2! z-10! block! w-[140%]! h-0.5! -bg-black! bg-black! origin-center! -rotate-45! -translate-x-1/2! -translate-y-1/2! pointer-events-none!"
				/>
			)}
		</div>
	);

	if (link) {
		return (
			<div className="flex! items-center! gap-2!">
				{colorIndicator}

				<Link
					href={link}
					className={`
						w-auto! h-auto!
						bg-transparent!
						cursor-pointer!
						link-primary!
						link-hover!
						text-xs!
						text-nowrap!
						${hidden ? "line-through! text-base-content/50!" : ""}
					`}
				>
					{value}
				</Link>
			</div>
		);
	}

	return (
		<div className="flex! items-center! gap-2!">
			{colorIndicator}

			<div
				className={`
					text-xs!
					text-nowrap!
					${hidden ? "line-through! text-base-content/50!" : ""}
				`}
			>
				{value}
			</div>
		</div>
	);
}
