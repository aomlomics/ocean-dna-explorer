"use client";

import type { AnalysisModel, ProjectModel } from "@/app/generated/prisma/models";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useDebouncedCallback } from "use-debounce";
import { AnalysisIcon, ProjectIcon } from "../icons";
import { exploreUrl } from "@/app/helpers/utils";

export default function MySubmissionsSidebar({
	projects
}: {
	projects: {
		project_id: ProjectModel["project_id"];
		Analyses: {
			analysis_run_name: AnalysisModel["analysis_run_name"];
			trusted: AnalysisModel["trusted"];
			_count: { Libraries: number };
		}[];
		_count: { Samples: number };
	}[];
}) {
	const [search, setSearch] = useState("");
	const handleSearch = useDebouncedCallback(setSearch, 300);
	const lowerSearch = search.toLowerCase();

	return (
		<div className="self-start flex flex-col gap-5">
			<fieldset className="fieldset pr-5">
				<legend className="fieldset-legend">Search projects and analyses</legend>
				<input
					type="text"
					name="search"
					className="input w-full"
					placeholder="Search"
					onChange={(e) => {
						handleSearch(e.target.value);
					}}
				/>
			</fieldset>

			<div className="flex flex-col gap-3 overflow-y-auto h-[65vh] pr-5">
				{projects.reduce((acc: ReactNode[], proj: (typeof projects)[number]) => {
					const analysisMatch = proj.Analyses.some((a) => a.analysis_run_name.toLowerCase().includes(lowerSearch));
					if (proj.project_id.toLowerCase().includes(lowerSearch) || analysisMatch) {
						acc.push(
							<div key={proj.project_id} className="border border-base-300 rounded-lg p-2 flex flex-col gap-1">
								<div className="flex justify-between items-center gap-1 w-full">
									<Link
										href={`/mySubmissions/${proj.project_id}`}
										className={`grow flex gap-3 items-center hover:bg-base-200 rounded-lg p-3 pt-2 break-all ${proj._count.Samples ? "border border-error" : ""}`}
									>
										<ProjectIcon className="text-primary h-full" />
										{proj.project_id}
									</Link>

									<Link
										href={exploreUrl({
											table: "project",
											project_id: proj.project_id
										})}
										className="self-stretch"
									>
										<ExternalLinkSvg />
									</Link>
								</div>

								{analysisMatch ? (
									<div className="flex gap-2 items-center pl-2">
										<AnalysisIcon className="text-primary" />
										<div className="ml-3 pl-2 border-l border-primary flex flex-col gap-1 w-full">
											{proj.Analyses.reduce((acc: ReactNode[], a: (typeof proj.Analyses)[number]) => {
												if (a.analysis_run_name.toLowerCase().includes(lowerSearch)) {
													acc.push(
														<div
															className="flex justify-between items-center gap-1 w-full"
															key={`${proj.project_id}/${a.analysis_run_name}`}
														>
															<Link
																href={`/mySubmissions/${proj.project_id}/${a.analysis_run_name}`}
																className={`grow flex items-center gap-5 hover:bg-base-200 rounded-lg px-3 py-2 break-all ${a._count.Libraries ? "border border-error" : ""}`}
															>
																{a.analysis_run_name}

																{a.trusted ? (
																	<div className="badge badge-primary badge-sm text-neutral-content shrink-0">
																		Trusted
																	</div>
																) : (
																	<></>
																)}
															</Link>

															<Link
																href={exploreUrl({
																	table: "analysis",
																	project_id: proj.project_id,
																	analysis_run_name: a.analysis_run_name
																})}
																className="self-stretch"
															>
																<ExternalLinkSvg />
															</Link>
														</div>
													);
												}

												return acc;
											}, [])}
										</div>
									</div>
								) : (
									<></>
								)}
							</div>
						);
					}

					return acc;
				}, [])}
			</div>
		</div>
	);
}

function ExternalLinkSvg() {
	return (
		<div className="w-10 h-full flex items-center justify-center rounded-lg hover:bg-base-200">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				className="text-primary w-6 h-6"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g>
					<path
						id="Vector"
						d="M10.0002 5H8.2002C7.08009 5 6.51962 5 6.0918 5.21799C5.71547 5.40973 5.40973 5.71547 5.21799 6.0918C5 6.51962 5 7.08009 5 8.2002V15.8002C5 16.9203 5 17.4801 5.21799 17.9079C5.40973 18.2842 5.71547 18.5905 6.0918 18.7822C6.5192 19 7.07899 19 8.19691 19H15.8031C16.921 19 17.48 19 17.9074 18.7822C18.2837 18.5905 18.5905 18.2839 18.7822 17.9076C19 17.4802 19 16.921 19 15.8031V14M20 9V4M20 4H15M20 4L13 11"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</g>
			</svg>
		</div>
	);
}
