import Link from "next/link";
import { ReactNode } from "react";
import AnalysisTag from "../../../tags/AnalysisTag";
import { Prisma, Tag } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { capitalizeTable, depluralizeTable, uncapitalizeTable } from "@/app/helpers/utils";
import { DeadValueEnum } from "@/types/enums";
import { LinkIcon } from "../../../icons";
import { TableColumns } from "../hooks/useTableColumns";
import { TableQuery } from "../hooks/useTableQuery";

export default function TableRow({
	row,
	i,
	table,
	headers,
	headersFilter,
	emptyFilter,
	userDefinedHeaders,
	title,
	manyRelations,
	oneRelations,
	oneRelationsWithArrayTitle,
	deepRelations,
	deepRelationsFilter,
	page,
	take
}: {
	row: Record<string, any>;
	i: number;
	table: Uncapitalize<Prisma.ModelName>;
	headers: string[];
	headersFilter: Record<string, boolean>;
	emptyFilter: Record<string, true>;
	userDefinedHeaders: string[];
	title: TableColumns["title"];
	manyRelations: TableColumns["manyRelations"];
	oneRelations: TableColumns["oneRelations"];
	oneRelationsWithArrayTitle: TableColumns["oneRelationsWithArrayTitle"];
	deepRelations: TableColumns["deepRelations"];
	deepRelationsFilter: TableQuery["deepRelationsFilter"];
	page: TableQuery["page"];
	take: TableQuery["take"];
}) {
	return (
		<tr key={"row" + i} className="h-12 align-middle">
			{typeof title === "string" ? (
				<th
					className={`whitespace-nowrap text-sm font-bold bg-base-200 border-base-300 py-5 border-r-2 ${
						i ? "border-t-2" : ""
					}`}
				>
					<Link href={`/explore/${table}/${encodeURIComponent(row[title])}`} className="link link-primary link-hover">
						{row[title]}
					</Link>
				</th>
			) : (
				<th
					className={`whitespace-nowrap text-sm font-bold bg-base-200 border-base-300 py-5 border-r-2 ${
						i ? "border-t-2" : ""
					}`}
				>
					<Link
						href={`/explore/${table}/${title.map((f) => encodeURIComponent(row[f])).join("/")}`}
						className="link link-primary link-hover"
					>
						{title.map((f) => (row[f].length > 15 ? row[f].slice(0, 10) + "..." : row[f])).join(" / ")}
					</Link>
				</th>
			)}

			{headers.reduce((acc: ReactNode[], head, j) => {
				if (!headersFilter[head] && !emptyFilter[head]) {
					const deepRel = deepRelations.find((rel) => head === rel.label);

					//cell
					if (manyRelations.includes(head)) {
						if (head === "Tags") {
							acc.push(
								<td
									className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
										i ? "border-t-2" : ""
									} ${row.Tags.length === 0 ? "bg-base-200" : ""}`}
									key={head + "child" + j}
								>
									<div className="flex gap-3">
										{row.Tags.map((t: Tag) => (
											<AnalysisTag key={t.tagName} tag={t} hideDescription />
										))}
									</div>
								</td>
							);
						} else {
							acc.push(
								<td
									className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}
									key={head + "child" + j}
								>
									<div className="flex justify-center">
										<Link
											className="btn text-nowrap"
											href={`/search?table=${depluralizeTable(head as Prisma.ModelName)}&advanced=[${
												typeof title === "string"
													? `["${table}", "${title}", "equals", "${row[title]}"]`
													: title.map((t) => `["${table}", "${t}", "equals", "${row[t]}"]`).join(",")
											}]`}
										>
											<LinkIcon /> {row._count[head]}{" "}
											{row._count[head] === 1 ? capitalizeTable(depluralizeTable(head as Prisma.ModelName)) : head}
										</Link>
									</div>
								</td>
							);
						}
					} else if (deepRel) {
						if (!deepRelationsFilter[deepRel.label]) {
							if (deepRel.type === "many") {
								acc.push(
									<td
										className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}
										key={deepRel.label + "child" + j}
									>
										<div className="flex justify-center">
											<Link
												className="btn text-nowrap"
												href={`/search?table=${deepRel.table}&advanced=[${
													typeof title === "string"
														? `["${table}", "${title}", "equals", "${row[title]}"]`
														: title.map((t) => `["${table}", "${t}", "equals", "${row[t]}"]`).join(",")
												}]`}
											>
												<LinkIcon /> {row._count[deepRel.label]}{" "}
												{row._count[deepRel.label] === 1 ? capitalizeTable(deepRel.table) : deepRel.label}
											</Link>
										</div>
									</td>
								);
							} else {
								const path = [...TableMetadata[table].relationPaths[deepRel.table]!];
								const titleFieldObj = path.reduce((obj, curr) => obj[curr.field], row[path.shift()!.field]);

								if (deepRel.type === "table") {
									acc.push(
										<td
											className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}
											key={deepRel.label + "child" + j}
										>
											<Link
												href={`/explore/${deepRel.table}/${(TableMetadata[deepRel.table].titleField as string[]).map((f) => encodeURIComponent(titleFieldObj[f])).join("/")}`}
												className="link link-primary link-hover font-bold"
											>
												{(TableMetadata[deepRel.table].titleField as string[])
													.map((f) =>
														titleFieldObj[f].length > 15 ? titleFieldObj[f].slice(0, 10) + "..." : titleFieldObj[f]
													)
													.join(" / ")}
											</Link>
										</td>
									);
								} else if (deepRel.type === "field") {
									acc.push(
										<td
											className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}
											key={deepRel.label + "child" + j}
										>
											<Link
												href={`/explore/${deepRel.table}/${encodeURIComponent(titleFieldObj[deepRel.label])}`}
												className="link link-primary link-hover font-bold"
											>
												{titleFieldObj[deepRel.label]}
											</Link>
										</td>
									);
								}
							}
						}
					} else if (userDefinedHeaders.includes(head)) {
						if (row.userDefined && row.userDefined[head]) {
							acc.push(
								<td
									className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}
									key={row.userDefined[head] + "child" + j}
								>
									{row.userDefined[head]}
								</td>
							);
						} else {
							acc.push(
								<td
									className={`whitespace-nowrap text-sm border-base-300 border-l-2 bg-base-200 ${
										i ? "border-t-2" : ""
									}`}
									key={"nullchild" + j}
								></td>
							);
						}
					} else {
						let element;
						if (oneRelations.includes(head as Prisma.ModelName)) {
							element = (
								<Link
									href={`/explore/${Object.keys(TableMetadata).find(
										(table) => TableMetadata[table as Prisma.ModelName].titleField === head
									)}/${encodeURIComponent(row[head])}`}
									className="link link-primary link-hover font-bold"
								>
									{row[head]}
								</Link>
							);
						} else if (head in oneRelationsWithArrayTitle) {
							const typedHead = head as Prisma.ModelName;
							element = (
								<Link
									href={`/explore/${uncapitalizeTable(typedHead)}/${oneRelationsWithArrayTitle[typedHead]
										.map((f) => encodeURIComponent(row[f]))
										.join("/")}`}
									className="link link-primary link-hover font-bold"
								>
									{oneRelationsWithArrayTitle[typedHead]
										.map((f) => (row[f].length > 15 ? row[f].slice(0, 10) + "..." : row[f]))
										.join(" / ")}
								</Link>
							);
						} else if (row[head] in DeadValueEnum && typeof row[head] === "number") {
							element = DeadValueEnum[row[head]];
						} else if (URL.canParse(row[head]) && row[head].startsWith("https://")) {
							element = (
								<a href={row[head]} className="link link-primary link-hover">
									{row[head]}
								</a>
							);
						} else if (typeof row[head] === "boolean") {
							if (row[head]) {
								element = (
									<svg
										width="30px"
										height="30px"
										viewBox="0 0 1920 1920"
										xmlns="http://www.w3.org/2000/svg"
										className="text-success w-full"
										stroke="currentColor"
										fill="currentColor"
									>
										<path d="M1827.701 303.065 698.835 1431.801 92.299 825.266 0 917.564 698.835 1616.4 1919.869 395.234z" />
									</svg>
								);
							} else {
								element = (
									<svg
										width="45px"
										height="45px"
										viewBox="0 0 24 24"
										className="text-error w-full"
										stroke="currentColor"
										fill="currentColor"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M6 6L18 18M18 6L6 18" />
									</svg>
								);
							}
						} else {
							element = row[head];
						}

						acc.push(
							<td
								className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
									i ? "border-t-2" : ""
								} ${row[head] === null || row[head] in DeadValueEnum ? "bg-base-200" : ""}`}
								key={row[head] + "child" + j}
							>
								{element}
							</td>
						);
					}
				}

				return acc;
			}, [])}

			<th className={`border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}>{i + 1 + (page - 1) * take}</th>
		</tr>
	);
}
