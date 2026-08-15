"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { MapLocation, MapLocationWithValues } from "@/types/globals";
import { DEFAULT_COLOR, getLegendColor, getLegendValue, LegendInfo, legendValueSort } from "../utils/mapUtils";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import TableMetadata, { TableMetadataValue } from "@/types/tableMetadata";
import { capitalizeTable, compressURIComponent, MAX_UNCOMPRESSED_LENGTH } from "@/app/helpers/utils";
import { getZodType } from "@/app/helpers/schema";

function compressIfNeeded(str: string) {
	if (str.length > MAX_UNCOMPRESSED_LENGTH) {
		return compressURIComponent(str);
	} else {
		return str;
	}
}

export default function PopupWithSearchBody({
	table,
	titleTable,
	loc,
	id,
	legendInfo,
	userDefinedOptions,
	href,
	disableSearch
}: {
	table: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	loc: MapLocationWithValues;
	id: TableMetadataValue["titleField"];
	legendInfo: LegendInfo;
	userDefinedOptions: Set<string>;
	href?: string;
	disableSearch?: true;
}) {
	const [filter, setFilter] = useState("");
	const [filteredValues, setFilteredValues] = useState(loc.values ? loc.values : undefined);

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
			{titleTable && (
				<Link
					href={`/explore/${titleTable}/${
						typeof TableMetadata[titleTable].titleField === "string"
							? encodeURIComponent(loc[TableMetadata[titleTable].titleField])
							: TableMetadata[titleTable].titleField.map((f) => encodeURIComponent(loc[f])).join("/")
					}`}
					className="w-auto! h-auto! bg-transparent! cursor-pointer! link-primary! link-hover! text-xl! self-start text-nowrap"
				>
					{typeof TableMetadata[titleTable].titleField === "string"
						? loc[TableMetadata[titleTable].titleField]
						: TableMetadata[titleTable].titleField.map((f) => loc[f]).join(" / ")}
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
							{disableSearch ? (
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
						<div className="flex flex-col overflow-y-scroll overscroll-contain [:where(&)]:pr-2">
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
														className="cursor-pointer! link-primary! link-hover!  leading-[1.3]! text-xs"
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
												className="cursor-pointer! link-primary! link-hover! border-none! leading-[1.3]! text-xs"
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
										className="cursor-pointer! link-primary! link-hover! border-none! leading-[1.3]! text-xs"
									>
										{locUrl}
									</Link>
								</div>
							</>
						) : (
							<Link
								href={`/explore/${table}/${locUrl}`}
								className="cursor-pointer! link-primary! link-hover! border-none! leading-[1.3]! text-xs"
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
