"use client";

import { ChangeEvent, SubmitEvent, ReactNode, useEffect, useReducer, useRef, useState } from "react";
import ProgressBar from "../ProgressBar";
import SubmitFormSection from "./SubmitFormSection";
import Modal from "../Modal";
import { NetworkPacket, NetworkProgressPacket } from "@/types/globals";
import { Project } from "@/prisma/generated/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import analysisSubmitAction from "@/app/actions/analysis/create/analysisSubmit";
import { parse } from "csv-parse";
import { upload } from "@vercel/blob/client";
import { doProgressActionMany } from "@/app/helpers/progress";
import { Tag } from "@/app/generated/prisma/client";
import AnalysisTag from "../tags/AnalysisTag";

type ResponseSet = {
	analysis: NetworkProgressPacket;
	assignments: NetworkProgressPacket;
	occurrences: NetworkProgressPacket;
};

export default function AnalysisSubmit({ tags }: { tags: Tag[] }) {
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	//refs for popup modal
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	//list of analyses added to page, stored as a string of the analysis_run_name, -1 means the analysis was deleted from the list, -2 means the analysis file has not been selected yet
	const [analysisIds, setAnalysisIds] = useState([-2] as Array<string | -1 | -2>);
	const [prevAnalysisIdsLength, setPrevAnalysisIdsLength] = useState(1);

	//detecting what project the analyses are associated with and whether it's trusted or not
	const [project, setProject] = useState<Project | null>(null);
	const [trusted, setTrusted] = useState(false);

	//list of tags to be added to submitted analyses
	const [selectedTags, setSelectedTags] = useState([] as Tag[]);

	//response state, where the key is the analysisId, and the value is an object with a key for each file name ("analysis", "assignments", and "occurrences") and values of the network response for that file name
	//usage:
	//	to set value of single response: setResponses({ id: <analysisId>, key: <fileName>, res: <response> })
	//	to clear one response: setResponses({ id: <analysisId>, clear: true })
	//	to clear all responses: setResponses()
	const [responses, setResponses] = useReducer(
		(
			state: Record<string, ResponseSet>,
			update?: { id: string; clear: true } | { id: string; key: string; res: NetworkProgressPacket; clear?: undefined }
		) => {
			if (update) {
				if (update.clear) {
					const temp = { ...state };
					delete temp[update.id];
					return temp;
				} else {
					if (update.res?.statusMessage === "error") {
						//TODO: don't stop loading until ALL submissions complete
						setLoading(false);
						setErrorMessage(update.res.error);
						modalRef.current?.showModal();
						//use trigger to call the delete once, instead of for every error
					} else if (update.res?.statusMessage === "success") {
						//check if current analysis was completed successfully
						if (
							Object.entries(state[update.id]).every(
								//make sure to include current key, since we already checked that
								([key, res]) => key === update.key || res?.statusMessage === "success"
							)
						) {
							//check if all analyses were completed successfully
							if (
								Object.entries(state).every(
									([id, resSet]) =>
										//make sure to include current analysis, since we already checked that
										id === update.id || Object.values(resSet).every((res) => res?.statusMessage === "success")
								)
							) {
								//redirect user to Analysis explore page
								setLoading(false);
								modalXRef.current!.disabled = true;
								modalClickOffRef.current!.disabled = true;
								modalRef.current?.showModal();
								setTimeout(() => {
									router.push("/explore/analysis");
								}, 5000);
							}
						}
					}

					return { ...state, [update.id]: { ...state[update.id], [update.key]: update.res } };
				}
			} else {
				return {};
			}
		},
		{}
	);

	useEffect(() => {
		if (analysisIds.length > prevAnalysisIdsLength) {
			const element = document.getElementById((analysisIds.length - 1).toString());
			if (element) {
				element.scrollIntoView({
					block: "start",
					behavior: "smooth"
				});
			}
		}

		if (analysisIds.length !== prevAnalysisIdsLength) {
			setPrevAnalysisIdsLength(analysisIds.length);
		}
	}, [analysisIds]);

	//TODO: add loading overlay when this is called
	//read analysis file to get the analysis_run_name
	//also get the project this analysis is associated with, verify all analyses on this page are associated with the same project
	async function parseAnalysis(event: ChangeEvent<HTMLInputElement>, i: number) {
		try {
			if (event.target.files?.length) {
				const file = event.target.files[0] as File;

				let currAnalysis_run_name = "";
				let currProject = undefined as Project | undefined;

				//parse file
				const parser = parse(await file.text(), { columns: true, delimiter: "\t", relax_quotes: true });
				for await (const record of parser) {
					const field = record.term_name;
					const value = record.values;

					//if missing both required fields, simply skip the line
					if (field && value) {
						//get value if the row is for the analysis_run_name field
						if (field === "analysis_run_name") {
							if (analysisIds.includes(value)) {
								setErrorMessage(`Analysis with analysis_run_name of "${value}" is already in the form.`);
								modalRef.current?.showModal();
								event.target.value = "";
								return;
							}

							currAnalysis_run_name = value;
						}

						//get value if the row is for the project_id field
						if (field === "project_id") {
							//check if the project is different from the project already selected
							if (project && analysisIds.filter((id) => id !== -1).length !== 1) {
								currProject = project;

								if (value !== project.project_id) {
									setErrorMessage("All analyses must be for the same project.");
									modalRef.current?.showModal();
									event.target.value = "";
									return;
								}
							} else {
								//get project from database
								const response = await fetch(`/api/project?project_id=${value}&fields=project_id`);
								const json = (await response.json()) as NetworkPacket;

								//handle errors
								if (json.statusMessage === "error") {
									setErrorMessage(json.error);
									modalRef.current?.showModal();
									event.target.value = "";
									return;
								} else {
									currProject = json.result[0];

									//project with given project_id does not exist
									if (!currProject) {
										setErrorMessage(`Could not find Project with project_id of ${value}.`);
										modalRef.current?.showModal();
										event.target.value = "";
										return;
									}
								}
							}
						}

						//replace -2 (not selected yet) id with analysis_run_name from file in analysisId list
						if (currAnalysis_run_name && currProject) {
							setAnalysisIds(analysisIds.toSpliced(i, 1, currAnalysis_run_name));
							setProject(currProject);
							return;
						}
					}
				}

				//missing fields
				if (!currAnalysis_run_name) {
					setErrorMessage("Could not find analysis_run_name in term_name column.");
					modalRef.current?.showModal();
					event.target.value = "";
				} else if (!currProject) {
					setErrorMessage("Could not find project_id in term_name column.");
					modalRef.current?.showModal();
					event.target.value = "";
				}
			}
		} catch (err) {
			console.log(err);
			setErrorMessage("Analysis Metadata file in wrong format.");
			modalRef.current?.showModal();
			event.target.value = "";
		}
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!project) {
			setErrorMessage("No project_id found.");
			modalRef.current?.showModal();
			return;
		}

		try {
			setLoading(true);
			setErrorMessage("");

			const target = event.target as HTMLFormElement;
			const files = {} as Record<string, { analysisFile: File; assignmentsFile: File; occurrencesFile: File }>;

			const activeIds = analysisIds.filter((id) => {
				if (typeof id === "string") {
					//skip files that have already been successfully submitted
					if (
						!(
							responses[id] &&
							Object.values(responses[id]).every((packet) => packet && packet.statusMessage === "success")
						)
					) {
						//gather files
						files[id] = {
							analysisFile: target[`analysis_${id}`].files[0],
							assignmentsFile: target[`assignments_${id}`].files[0],
							occurrencesFile: target[`occurrences_${id}`].files[0]
						};

						//set status of uploads to pending
						setResponses({
							id: id,
							key: "analysis",
							res: { statusMessage: "progress", progress: { message: "Pending...", value: 0 } }
						});
						setResponses({
							id: id,
							key: "assignments",
							res: { statusMessage: "progress", progress: { message: "Pending...", value: 0 } }
						});
						setResponses({
							id: id,
							key: "occurrences",
							res: { statusMessage: "progress", progress: { message: "Pending...", value: 0 } }
						});

						return true;
					}
				}
			}) as string[];

			if (activeIds.length) {
				//scroll first analysis into view
				document.getElementById(activeIds[0])!.scrollIntoView({
					block: "start",
					behavior: "smooth"
				});

				//submit for every analysis section
				for (const id of activeIds) {
					//upload file to blob storage
					setResponses({
						id,
						key: "analysis",
						res: { statusMessage: "progress", progress: { message: "Uploading file", value: 1 } }
					});
					const analysisUrl = (
						await upload(`submissions/${encodeURIComponent(files[id].analysisFile.name)}`, files[id].analysisFile, {
							access: "public",
							handleUploadUrl: "/api/file/upload",
							multipart: files[id].analysisFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
						})
					).url;
					setResponses({
						id,
						key: "analysis",
						res: { statusMessage: "progress", progress: { message: "File uploaded", value: 5 } }
					});

					//assignments submit
					//upload file to blob storage
					setResponses({
						id,
						key: "assignments",
						res: { statusMessage: "progress", progress: { message: "Uploading file", value: 1 } }
					});
					const assignmentsUrl = (
						await upload(
							`submissions/${encodeURIComponent(files[id].assignmentsFile.name)}`,
							files[id].assignmentsFile,
							{
								access: "public",
								handleUploadUrl: "/api/file/upload",
								multipart: files[id].assignmentsFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
							}
						)
					).url;
					setResponses({
						id,
						key: "assignments",
						res: { statusMessage: "progress", progress: { message: "File uploaded", value: 5 } }
					});

					//occurrences submit
					//upload file to blob storage
					setResponses({
						id,
						key: "occurrences",
						res: { statusMessage: "progress", progress: { message: "Uploading file", value: 1 } }
					});
					const occurrencesUrl = (
						await upload(
							`submissions/${encodeURIComponent(files[id].occurrencesFile.name)}`,
							files[id].occurrencesFile,
							{
								access: "public",
								handleUploadUrl: "/api/file/upload",
								multipart: files[id].occurrencesFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
							}
						)
					).url;
					setResponses({
						id,
						key: "occurrences",
						res: { statusMessage: "progress", progress: { message: "File uploaded", value: 5 } }
					});

					//trigger streamed action
					doProgressActionMany(
						analysisSubmitAction,
						[
							(res) => setResponses({ id, key: "analysis", res }),
							(res) => setResponses({ id, key: "assignments", res }),
							(res) => setResponses({ id, key: "occurrences", res })
						],
						analysisUrl,
						assignmentsUrl,
						occurrencesUrl,
						trusted,
						selectedTags.map((t) => t.tagName)
					);
				}
			}
		} catch (err) {
			const error = err as Error;

			setLoading(false);
			setErrorMessage(error.message);
			modalRef.current?.showModal();
		}
	}

	return (
		<>
			<form className="grid grid-cols-12 gap-10 w-full" onSubmit={handleSubmit}>
				{/* Left column: project info and privacy */}
				<div className="col-span-5 space-y-6">
					<SubmitFormSection title="Project">
						<div className="w-full">
							{project ? (
								<Link className="link link-primary" href={`/explore/project/${encodeURIComponent(project.project_id)}`}>
									{project.project_id}
								</Link>
							) : (
								"No Analysis selected yet"
							)}
						</div>
					</SubmitFormSection>
					<SubmitFormSection
						title="Make Analyses trusted"
						info="These Analyses will be labeled as the trusted Analysis for all Libraries used in it. Any other Analyses that use any Libraries in this submission that also produce a shared feature will be no longer be trusted."
					>
						<fieldset className="fieldset">
							<label className="fieldset-label flex gap-2">
								<input
									type="checkbox"
									className="checkbox"
									checked={trusted}
									onChange={(e) => setTrusted(e.target.checked)}
								/>
								<p>Trusted submission</p>
							</label>
						</fieldset>
					</SubmitFormSection>
					<SubmitFormSection title="Add tags to Analyses">
						<div className="flex gap-5 flex-wrap items-center">
							{selectedTags.map((t) => (
								<div key={t.tagName} className="flex gap-1 items-center">
									<AnalysisTag tag={t} />
									<button
										className="btn btn-error btn-xs"
										onClick={() => setSelectedTags(selectedTags.filter((st) => st.tagName !== t.tagName))}
										disabled={!!loading}
									>
										-
									</button>
								</div>
							))}
							{tags.length !== selectedTags.length ? (
								<div className="dropdown">
									<button className="btn btn-sm" tabIndex={0} role="button" disabled={!!loading}>
										+
									</button>
									<ul tabIndex={-1} className="dropdown-content menu bg-base-200 rounded-box shadow-sm p-2 flex-nowrap">
										<div className="max-h-75 overflow-y-scroll overscroll-contain flex flex-col gap-2">
											{tags.reduce((acc, t) => {
												if (!selectedTags.find((st) => st.tagName === t.tagName)) {
													acc.push(
														<li key={t.tagName} className="w-full">
															<a
																className="flex justify-center"
																onClick={() => {
																	setSelectedTags([...selectedTags, t]);
																	(document.activeElement as HTMLDivElement).blur();
																}}
															>
																<AnalysisTag tag={t} hideDescription />
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
					</SubmitFormSection>
				</div>

				{/* Right column: files + progress + submit */}
				<div className="col-span-7">
					<SubmitFormSection
						title="Upload files"
						className="space-y-6 w-full text-base-content/80 text-base font-normal"
					>
						{analysisIds.map((id, i) => (
							<AnalysisFormSection
								key={i}
								i={i}
								id={id}
								deletable={analysisIds.filter((id) => id !== -1).length > 1}
								loading={loading}
								onAnalysisChange={async (event: ChangeEvent<HTMLInputElement>) => await parseAnalysis(event, i)}
								responseSet={responses[id]}
								onDelete={() => {
									const temp = analysisIds.toSpliced(i, 1, -1);
									setAnalysisIds(temp);
									if (temp.filter((id) => typeof id === "string").length === 0) {
										setProject(null);
									}
								}}
							/>
						))}

						<div className="pt-6 space-y-4">
							<div className="flex gap-4">
								<button
									className="btn btn-base-100 text-base-content/80 hover:text-base-content"
									type="button"
									disabled={!!loading}
									onClick={() => setAnalysisIds([...analysisIds, -2])}
								>
									+ Add Another Analysis
								</button>
								<button className="btn btn-success" disabled={loading}>
									Submit
								</button>
							</div>

							{loading ? (
								<div>
									<span className="loading loading-spinner loading-xl"></span>
								</div>
							) : (
								errorMessage && (
									<div>
										<div className="tooltip tooltip-error" data-tip={errorMessage}>
											<span className="text-white text-xl w-8 aspect-square rounded-full flex items-center justify-center border-2 border-error bg-error/10">
												✕
											</span>
										</div>
									</div>
								)
							)}
						</div>
					</SubmitFormSection>
				</div>
			</form>

			<Modal ref={modalRef} xRef={modalXRef} clickOffRef={modalClickOffRef}>
				<h3 className={`text-lg font-bold mb-2 ${errorMessage ? "text-error" : "text-success"}`}>
					{errorMessage ? "Submission Failed" : "Analysis Submitted Successfully"}
				</h3>
				<p className="mb-2 font-light whitespace-pre-wrap">{errorMessage ?? ""}</p>
				{!errorMessage && (
					<div className="mt-4 flex items-center justify-center gap-2">
						<span className="loading loading-spinner loading-sm"></span>
						<span className="text-base-content/80 text-sm">Redirecting...</span>
					</div>
				)}
			</Modal>
		</>
	);
}

function AnalysisFormSection({
	id,
	i,
	deletable,
	loading,
	onAnalysisChange,
	onDelete,
	responseSet
}: {
	id: string | -1 | -2;
	i: number;
	deletable: boolean;
	loading: boolean;
	onAnalysisChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
	onDelete: () => void;
	responseSet: ResponseSet | undefined;
}) {
	if (id === -1) {
		return <></>;
	}

	return (
		<div className="border border-base-300 rounded-lg p-4 space-y-4 mb-4">
			<div id={typeof id === "string" ? id : i.toString()} className="flex justify-between items-center">
				<h3 className="text-lg font-normal text-primary">{typeof id === "string" ? id : "New Analysis"}</h3>
				{deletable && (
					<button className="btn btn-sm btn-error rounded-full" type="button" disabled={loading} onClick={onDelete}>
						×
					</button>
				)}
			</div>

			<div className="space-y-2">
				<fieldset className="fieldset">
					<legend className="fieldset-legend text-sm text-base-content/80 font-normal">Analysis Metadata File:</legend>
					<input
						type="file"
						className="file-input file-input-primary"
						name={`analysis_${id}`}
						required
						disabled={loading}
						accept=".tsv"
						onChange={onAnalysisChange}
					/>
				</fieldset>
				<ProgressBar loading={loading} data={responseSet?.analysis} />
			</div>

			<div className="space-y-2">
				<fieldset className="fieldset">
					<legend className="fieldset-legend text-sm text-base-content/80 font-normal">ASV Taxa/Features File:</legend>
					<input
						type="file"
						className="file-input file-input-primary"
						name={`assignments_${id}`}
						required
						disabled={typeof id !== "string" || loading}
						accept=".tsv"
					/>
				</fieldset>
				<ProgressBar loading={loading} data={responseSet?.assignments} />
			</div>

			<div className="space-y-2">
				<fieldset className="fieldset">
					<legend className="fieldset-legend text-sm text-base-content/80 font-normal">Occurrence Table File:</legend>
					<input
						type="file"
						className="file-input file-input-primary"
						name={`occurrences_${id}`}
						required
						disabled={typeof id !== "string" || loading}
						accept=".tsv"
					/>
				</fieldset>
				<ProgressBar loading={loading} data={responseSet?.occurrences} />
			</div>
		</div>
	);
}
