"use client";

import { ChangeEvent, FormEvent, useEffect, useReducer, useRef, useState } from "react";
import ProgressBar from "../ProgressBar";
import SubmitFormSection from "./SubmitFormSection";
import Modal from "../Modal";
import { NetworkPacket, NetworkProgressPacket } from "@/types/globals";
import { Project } from "@/prisma/generated/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import analysisSubmitAction from "@/app/actions/analysis/submit/analysisSubmit";
import assignSubmitAction from "@/app/actions/analysis/submit/assignSubmit";
import occSubmitAction from "@/app/actions/analysis/submit/occSubmit";
import { parse } from "csv-parse";
import { upload } from "@vercel/blob/client";
import analysisDeleteAction from "@/app/actions/analysis/analysisDelete";
import { doProgressAction } from "@/app/helpers/progress";

type ResponseSet = {
	analysis: NetworkProgressPacket;
	assignments: NetworkProgressPacket;
	occurrences: NetworkProgressPacket;
};

export default function AnalysisSubmit() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	//state variable that will have any error passed to it
	const [errorMessage, setErrorMessage] = useState("");

	//refs for popup modal
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	//list of analyses added to page, stored as a string of the analysis_run_name, -1 means the analysis was deleted from the list, -2 means the analysis file has not been selected yet
	const [analysisIds, setAnalysisIds] = useState([-2] as Array<string | -1 | -2>);
	const [prevAnalysisIdsLength, setPrevAnalysisIdsLength] = useState(1);

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
						setLoading(false);
						setErrorMessage(update.res.error);
						modalRef.current?.showModal();
					}
					return { ...state, [update.id]: { ...state[update.id], [update.key]: update.res } };
				}
			} else {
				return {};
			}
		},
		{}
	);

	//detecting what project the analyses are associated with, and whether the project is private
	const [project, setProject] = useState<Project | null>(null);
	const [isPrivate, setIsPrivate] = useState(false);

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

	//read analysis file to get the analysis_run_name
	//also get the project this analysis is associated with, verify all analyses on this page are associated with the same project, and detect if the project is private or not
	async function parseAnalysis(event: ChangeEvent<HTMLInputElement>, i: number) {
		try {
			if (event.target.files?.length) {
				const file = event.target.files[0] as File;

				let currAnalysis_run_name = "";
				let currProject = undefined as Project | undefined;

				//parse file
				const parser = parse(await file.text(), { columns: true, delimiter: "\t" });
				for await (const record of parser) {
					const field = record.term_name;
					const value = record.values;

					//if missing both required fields, simply skip the line
					if (field && value) {
						//get value if the row is for the analysis_run_name field
						if (field === "analysis_run_name") {
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
								const response = await fetch(`/api/project?project_id=${value}&fields=project_id,isPrivate`);
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
							setIsPrivate(currProject.isPrivate);
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
				} else {
					setErrorMessage("Unknown error occurred while parsing analysis file.");
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

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		//reset page state
		setErrorMessage("");
		const analysisSkips = [];
		for (const id in responses) {
			if (!Object.values(responses[id]).some((packet) => packet && packet.statusMessage !== "success")) {
				analysisSkips.push(id);
			} else {
				setResponses({ id, clear: true });
			}
		}

		const target = event.target as HTMLFormElement;

		const activeIds = analysisIds.filter((id) => typeof id === "string");
		try {
			//submit for every analysis section
			for (const id of activeIds) {
				//scroll analysis into view
				const element = document.getElementById(id);
				if (element) {
					element.scrollIntoView({
						block: "start",
						behavior: "smooth"
					});
				}

				//analysis submit
				const analysisFile = target[`analysis_${id}`].files[0] as File;
				//submit analysis file
				const analysisError = await doProgressAction({
					action: analysisSubmitAction,
					reducer: { id, key: "analysis", setter: setResponses },
					args: [analysisFile, isPrivate]
				});
				//handle errors
				if (analysisError) {
					setErrorMessage(analysisError);
					modalRef.current?.showModal();
					return;
				}

				try {
					//assignments submit
					const assignmentsFile = target[`assignments_${id}`].files[0] as File;
					//upload file to blob storage
					setResponses({
						id,
						key: "assignments",
						res: { statusMessage: "progress", progress: { message: "Uploading file", value: 5 } }
					});
					const assignmentsUrl = (
						await upload(assignmentsFile.name, assignmentsFile, {
							access: "public",
							handleUploadUrl: "/api/file/upload",
							multipart: assignmentsFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
						})
					).url;
					//submit assignments file url
					const assignmentsError = await doProgressAction({
						action: assignSubmitAction,
						reducer: { id, key: "assignments", setter: setResponses },
						args: [id, assignmentsUrl]
					});
					//delete file from blob storage
					await fetch(`/api/file/delete?url=${assignmentsUrl}`, {
						method: "DELETE"
					});
					//handle errors
					if (assignmentsError) {
						setErrorMessage(assignmentsError);
						modalRef.current?.showModal();

						//delete analysis
						const deleteResponse = await analysisDeleteAction(id);
						if (deleteResponse.statusMessage === "error") {
							setErrorMessage(assignmentsError + "\n" + deleteResponse.error);
						}
						return;
					}

					//occurrences submit
					const occurrencesFile = target[`occurrences_${id}`].files[0] as File;
					//upload file to blob storage
					setResponses({
						id,
						key: "occurrences",
						res: { statusMessage: "progress", progress: { message: "Uploading file", value: 5 } }
					});
					const occurrencesUrl = (
						await upload(occurrencesFile.name, occurrencesFile, {
							access: "public",
							handleUploadUrl: "/api/file/upload",
							multipart: occurrencesFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
						})
					).url;
					//submit occurrences file url
					const occurrencesError = await doProgressAction({
						action: occSubmitAction,
						reducer: { id, key: "occurrences", setter: setResponses },
						args: [id, occurrencesUrl]
					});
					//delete file from blob storage
					await fetch(`/api/file/delete?url=${occurrencesUrl}`, {
						method: "DELETE"
					});
					//handle errors
					if (occurrencesError) {
						setErrorMessage(occurrencesError);
						modalRef.current?.showModal();

						//delete analysis
						const deleteResponse = await analysisDeleteAction(id);
						if (deleteResponse.statusMessage === "error") {
							setErrorMessage(occurrencesError + "\n" + deleteResponse.error);
						}
						return;
					}
				} catch (err) {
					const error = err as Error;
					setErrorMessage(error.message);
					modalRef.current?.showModal();

					//delete analysis
					const deleteResponse = await analysisDeleteAction(id);
					if (deleteResponse.statusMessage === "error") {
						setErrorMessage(error.message + "\n" + deleteResponse.error);
					}

					setLoading(false);
					return;
				}
			}

			//redirect user to Analysis explore page
			modalXRef.current!.disabled = true;
			modalClickOffRef.current!.disabled = true;
			modalRef.current?.showModal();
			setTimeout(() => {
				router.push("/explore/analysis");
			}, 5000);
		} catch (err) {
			const error = err as Error;
			setErrorMessage(error.message);
			modalRef.current?.showModal();
		}

		setLoading(false);
	}

	return (
		<>
			<form className="flex flex-col items-center gap-5" onSubmit={handleSubmit}>
				<SubmitFormSection title="Project">
					<div className="text-center w-full">
						{project ? (
							<Link className="link link-primary" href={`/explore/project/${project.project_id}`}>
								{project.project_id}
							</Link>
						) : (
							"No analysis selected yet"
						)}
					</div>
				</SubmitFormSection>
				<SubmitFormSection
					title="Make submission private"
					info="Only users added to the Project for these Analyses will be able to see private submissions."
				>
					<fieldset className="fieldset bg-base-100">
						<label className="fieldset-label flex gap-2">
							<input
								type="checkbox"
								className="checkbox"
								checked={isPrivate}
								onChange={(e) => setIsPrivate(e.target.checked)}
								disabled={project?.isPrivate || false}
							/>
							<p>Private submission</p>
						</label>
					</fieldset>
				</SubmitFormSection>

				<SubmitFormSection title="Upload files" className="grid grid-cols-3 items-end gap-4 w-full text-base-content/80 text-base font-normal">
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
									setIsPrivate(false);
								}
							}}
						/>
					))}

					<button
						className="btn btn-sm bg-base-300 hover:bg-base-200 text-base-content shadow-sm col-2 justify-self-center"
						type="button"
						disabled={!!loading}
						onClick={() => setAnalysisIds([...analysisIds, -2])}
					>
						<span className="text-base-content">+</span> Add Another Analysis to Submission
					</button>

					<button className="btn btn-success col-2 justify-self-center" disabled={loading}>
						Submit
					</button>

					{loading ? (
						<div className="flex justify-center">
							<span className="loading loading-spinner loading-xl"></span>
						</div>
					) : (
						errorMessage && (
							<div className="flex justify-center">
								<div className="tooltip tooltip-error" data-tip={errorMessage}>
									<span className="text-white text-xl w-8 aspect-square rounded-full flex items-center justify-center border-2 border-error bg-error/10">
										✕
									</span>
								</div>
							</div>
						)
					)}
				</SubmitFormSection>
			</form>

			<Modal ref={modalRef} xRef={modalXRef} clickOffRef={modalClickOffRef}>
				<h3 className={`text-lg font-bold mb-2 ${errorMessage ? "text-error" : "text-success"}`}>
					{errorMessage ? "Submission Failed" : "Analysis Submitted Successfully"}
				</h3>
				<p className="mb-2 font-light whitespace-pre-wrap">{errorMessage ? errorMessage : ""}</p>
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
		<>
			<div id={typeof id === "string" ? id : i.toString()} className="flex justify-between gap-3 col-2">
				<h2 className="text-xl font-semibold text-base-content mb-4">{typeof id === "string" ? id : "New Analysis"}</h2>
				{deletable && (
					<button className="btn btn-sm btn-error rounded-full" type="button" disabled={loading} onClick={onDelete}>
						X
					</button>
				)}
			</div>

			<fieldset className="fieldset col-2">
				<legend className="fieldset-legend">Analysis Metadata File:</legend>
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

			<fieldset className="fieldset col-2">
				<legend className="fieldset-legend">ASV Taxa/Features File:</legend>
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

			<fieldset className="fieldset col-2">
				<legend className="fieldset-legend">Occurrence Table File:</legend>
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
		</>
	);
}
