"use client";

import type { MapLocation, MapLocationWithValues } from "@/types/globals";
import { DEFAULT_COLOR, getLegendColor, getLegendValue, type LegendInfo, legendValueSort } from "./mapUtils";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import { capitalizeTable, compressURIComponent, MAX_UNCOMPRESSED_LENGTH } from "@/app/helpers/utils";
import { getZodType } from "@/app/helpers/schema";

function compressIfNeeded(str: string) {
	if (str.length > MAX_UNCOMPRESSED_LENGTH) {
		return compressURIComponent(str);
	} else {
		return str;
	}
}

/**
 * Base utility component for {@link app/components/map/ActualMap.default | ActualMap} that displays a location. If the
 * location has a "values" property, then it will use that property to display a searchable list, grouped by distinct
 * legend values.
 */
export default function LocationList({
	table,
	titleTable,
	loc,
	legendInfo,
	userDefinedOptions,
	href,
	hideSearch
}: {
	/** Table that the map is showing points for. */
	table: Uncapitalize<ModelName>;
	/** The database table that the points will be grouped by. */
	titleTable?: Uncapitalize<ModelName>;
	/** The location point to be displayed on the map, which may contain a list of values. */
	loc: MapLocationWithValues;
	/** The object that stores information about the legend. */
	legendInfo: LegendInfo;
	/** A list of the legendOptions that come from the dataset's userDefined field. */
	userDefinedOptions: Set<string>;
	/**
	 * The URL that links to the search page. If not provided, a search URL using the "in" mode will be automatically
	 * constructed.
	 */
	href?: string;
	/** Show or hide the button that links to the Search page. */
	hideSearch?: true;
}) {
	const [filter, setFilter] = useState("");
	const [filteredValues, setFilteredValues] = useState(loc.values ? loc.values : undefined);

	const id = TableMetadata[table].titleField;
	const titleId = titleTable && TableMetadata[titleTable].titleField;

	useEffect(() => {
		if (loc.values) {
			const tempFilteredValues = [] as MapLocation[];
			const lowerFilter = filter.toLowerCase();
			for (const l of loc.values) {
				if (
					typeof id === "string"
						? l[id].toLowerCase().includes(lowerFilter)
						: id.some((f) => l[f].toLowerCase().includes(lowerFilter))
				) {
					tempFilteredValues.push(l);
				}
			}

			if (legendInfo) {
				if (legendInfo.mode === "discreet") {
					tempFilteredValues.sort((a, b) =>
						legendValueSort(
							getLegendValue(legendInfo.field, a, userDefinedOptions).toString(),
							getLegendValue(legendInfo.field, b, userDefinedOptions).toString()
						)
					);
				} else {
					tempFilteredValues.sort((a, b) => {
						if (getZodType(table, legendInfo.field).type === "date") {
							return new Date(a[legendInfo.field]).getTime() - new Date(b[legendInfo.field]).getTime();
						} else {
							return a[legendInfo.field] - b[legendInfo.field];
						}
					});
				}
			}

			// eslint-disable-next-line react-hooks/set-state-in-effect
			setFilteredValues(tempFilteredValues);
		}
	}, [filter, loc.values, legendInfo]);

	const locUrl =
		typeof id === "string" ? encodeURIComponent(loc[id]) : id.map((f) => encodeURIComponent(loc[f])).join("/");

	let valuesWithLegend;
	if (legendInfo) {
		valuesWithLegend = filteredValues?.map((l) => ({
			loc: l,
			legendValue: getLegendValue(legendInfo.field, l, userDefinedOptions).toString()
		})) as { loc: MapLocation; legendValue: string }[];
	}

	return (
		<>
			{titleId && (
				<Link
					href={`/explore/${titleTable}/${
						typeof titleId === "string"
							? encodeURIComponent(loc[titleId])
							: titleId.map((f) => encodeURIComponent(loc[f])).join("/")
					}`}
					className="w-auto! h-auto! bg-transparent! cursor-pointer! link-primary! link-hover! text-xl! self-start text-nowrap"
				>
					{typeof titleId === "string" ? loc[titleId] : titleId.map((f) => loc[f]).join(" / ")}
				</Link>
			)}
			{loc.values ? (
				<input
					type="text"
					onChange={(e) => setFilter(e.target.value)}
					value={filter}
					placeholder={`Filter ${TableMetadata[table].plural}...`}
					className="input input-primary input-xs w-full flex-initial min-w-0 text-primary my-1 text-nowrap"
				/>
			) : (
				<></>
			)}
			<>
				{filteredValues ? (
					<>
						<div className="flex justify-between gap-2 items-center">
							<h2 className="text-primary text-lg text-nowrap">
								{filteredValues.length === 1 ? capitalizeTable(table) : TableMetadata[table].plural} (
								{filteredValues.length})
							</h2>
							{hideSearch ? (
								<></>
							) : (
								<Link
									className="btn btn-xs btn-primary text-primary-content!"
									href={
										href
											? href
											: `/search?table=${table}&advanced=[${
													typeof id === "string"
														? `["${id}","in","${compressIfNeeded(
																'["' + filteredValues.map((v) => v[id]).join('","') + '"]'
															)}"]`
														: id
																.map(
																	(f) =>
																		`["${f}","in","${compressIfNeeded(
																			'["' + filteredValues.map((v) => v[f]).join('","') + '"]'
																		)}"]`
																)
																.join(",")
												}]`
									}
								>
									View as Search
								</Link>
							)}
						</div>
						<div className="flex flex-col overflow-y-scroll overscroll-contain mt-2 [:where(&)]:pr-3">
							{legendInfo
								? valuesWithLegend!.map(({ loc, legendValue }, i) => {
										const lUrl =
											typeof id === "string"
												? encodeURIComponent(loc[id])
												: id.map((f) => encodeURIComponent(loc[f])).join("/");

										const { color } = getLegendColor(legendInfo, loc, userDefinedOptions);

										return (
											<Fragment key={lUrl}>
												{legendValue !== (i > 0 ? valuesWithLegend![i - 1]!.legendValue : undefined) ? (
													<h3 className="text-base-content text-md text-nowrap">{legendValue}</h3>
												) : (
													<></>
												)}
												<div className="flex gap-2 items-center">
													<div
														className="aspect-square w-[1em] h-[1em]"
														style={{
															backgroundColor: color ? color.hex() : DEFAULT_COLOR.hex()
														}}
													></div>
													<Link
														href={`/explore/${table}/${lUrl}`}
														className="cursor-pointer! link-primary! link-hover!  leading-[1.3]! text-xs break-all"
													>
														{lUrl}
													</Link>
												</div>
											</Fragment>
										);
									})
								: filteredValues.map((loc) => {
										const lUrl =
											typeof id === "string"
												? encodeURIComponent(loc[id])
												: id.map((f) => encodeURIComponent(loc[f])).join("/");

										return (
											<Link
												key={lUrl}
												href={`/explore/${table}/${lUrl}`}
												className="cursor-pointer! link-primary! link-hover! border-none! leading-[1.3]! text-xs break-all"
											>
												{lUrl}
											</Link>
										);
									})}
						</div>
					</>
				) : (
					//TODO: name goes outside div when only 1
					<>
						<h2 className="text-primary text-lg">{capitalizeTable(table)}</h2>
						{legendInfo ? (
							<>
								<h3 className="text-base-content text-md text-nowrap">
									{getLegendValue(legendInfo.field, loc, userDefinedOptions).toString()}
								</h3>
								<div className="flex gap-2 items-center">
									<div
										className="aspect-square w-[1em] h-[1em]"
										style={{
											backgroundColor: legendInfo
												? getLegendColor(legendInfo, loc, userDefinedOptions).color.hex()
												: DEFAULT_COLOR.hex()
										}}
									></div>
									<Link
										href={`/explore/${table}/${locUrl}`}
										className="cursor-pointer! link-primary! link-hover! border-none! leading-[1.3]! text-xs break-all"
									>
										{locUrl}
									</Link>
								</div>
							</>
						) : (
							<Link
								href={`/explore/${table}/${locUrl}`}
								className="cursor-pointer! link-primary! link-hover! border-none! leading-[1.3]! text-xs break-all"
							>
								{locUrl}
							</Link>
						)}
					</>
				)}
			</>
		</>
	);
}
