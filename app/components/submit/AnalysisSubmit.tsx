"use client";

import assignSubmitAction from "@/app/actions/analysis/submit/assignSubmit";
import occSubmitAction from "@/app/actions/analysis/submit/occSubmit";
import { PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { useState, FormEvent, useReducer, useEffect, useRef } from "react";
import analysisSubmitAction from "../../actions/analysis/submit/analysisSubmit";
import analysisDeleteAction from "../../actions/analysis/analysisDelete";
import ProgressCircle from "./ProgressCircle";
import { useRouter } from "next/navigation";
import InfoButton from "../InfoButton";
import { Project } from "@/app/generated/prisma/client";
import { Action, NetworkPacket } from "@/types/globals";
import Link from "next/link";

function reducer(state: Record<string, string>, updates: Record<string, string>) {
	if (updates.reset) {
		return {};
	} else {
		return { ...state, ...updates };
	}
}

function checkAnalysisFiles(analysis: string, fileStates: Record<string, File | null>) {
	if (analysis === "\u200b") {
		return !!fileStates["\u200b"];
	}
	return (
		(!!fileStates[analysis] || !!fileStates["\u200b"]) &&
		!!fileStates[`${analysis}_assign`] &&
		!!fileStates[`${analysis}_occ`]
	);
}

//TODO: split file
export default function AnalysisSubmit() {
	const router = useRouter();
	const [responseObj, setResponseObj] = useReducer(reducer, {} as Record<string, string>);
	const [errorObj, setErrorObj] = useReducer(reducer, {} as Record<string, string>);
	const [loading, setLoading] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [analyses, setAnalyses] = useState(["\u200b"] as Array<string | null>);
	const [project, setProject] = useState<Project | null>(null);
	const [isPrivate, setIsPrivate] = useState(false); //TODO: (bug) adding analysis file unchecks box
	const [fileStates, setFileStates] = useState<Record<string, File | null>>({});

	// Modal state for submission feedback
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);
	const [modalMessage, setModalMessage] = useState("");
	const [isError, setIsError] = useState(false);

	//scroll newest analysis box into view
	useEffect(() => {
		for (let i = 1; i < analyses.length; i++) {
			if (analyses[analyses.length - i] !== null) {
				const element = document.getElementById(`analysis_${analyses.length - i}`);
				if (element) {
					element.scrollIntoView({
						block: "start",
						behavior: "smooth"
					});
					break;
				}
			}
		}
	}, [analyses]);

	async function parseAnalysis(input: HTMLInputElement, i: number) {
		try {
			if (input.files?.length) {
				const file = input.files[0];

				const lines = (await file.text()).replace(/[\r]+/gm, "").split("\n");
				const headers = lines[0].split("\t");
				for (let j = 1; j < lines.length; j++) {
					const currentLine = lines[j].split("\t");

					const fieldIndex = headers.indexOf("term_name");
					if (fieldIndex === -1) {
						setModalMessage("No column named 'term_name' in file.");
						setIsError(true);
						modalRef.current?.showModal();
						input.value = "";
						return;
					}
					const field = currentLine[fieldIndex];

					const valuesIndex = headers.indexOf("values");
					if (valuesIndex === -1) {
						setModalMessage("No column named 'values' in file.");
						setIsError(true);
						modalRef.current?.showModal();
						input.value = "";
						return;
					}
					const value = currentLine[valuesIndex];

					if (field === "analysis_run_name") {
						console.log(value);
						const tempAList = [...analyses];
						tempAList[i] = value;
						setAnalyses(tempAList);
						return;
					}

					if (field === "project_id") {
						console.log(value);
						if (project) {
							if (value !== project.project_id) {
								setModalMessage("All analyses must be for the same project.");
								setIsError(true);
								modalRef.current?.showModal();
								input.value = "";
								return;
							}
						} else {
							const response = await fetch(`/api/project?project_id=${value}&fields=project_id,isPrivate`);
							const json = (await response.json()) as NetworkPacket;

							if (json.statusMessage === "error") {
								setModalMessage(json.error);
								setIsError(true);
								modalRef.current?.showModal();
								input.value = "";
								return;
							} else {
								const project = json.result[0];
								setIsPrivate(project.isPrivate);
								setProject(project);
							}
						}
					}
				}

				setModalMessage("Analysis Metadata file in wrong format.");
				setIsError(true);
				modalRef.current?.showModal();
				input.value = "";
			}
		} catch (err) {
			setModalMessage("Analysis Metadata file in wrong format.");
			setIsError(true);
			modalRef.current?.showModal();
			input.value = "";
		}
	}

	async function dbDelete(deleteAction: Action, analysis_run_name: string) {
		try {
			const response = await deleteAction(analysis_run_name);
			if (response.statusMessage === "error") {
				setErrorObj({
					[analysis_run_name]: response.error
				});
			} else if (response.statusMessage === "success") {
				const tempResponseObj = { ...responseObj };
				setResponseObj({
					[analysis_run_name]: response.result
				});
			} else {
				setErrorObj({
					[analysis_run_name]: "Unknown error."
				});
			}
		} catch (err) {
			setErrorObj({
				[analysis_run_name]: `Error: ${(err as Error).message}.`
			});
		}
	}

	async function analysisFileSubmit({
		analysis_run_name,
		file,
		fileSuffix = "",
		submitAction,
		fieldsToSet = {},
		skipBlob = false
	}: {
		analysis_run_name: string;
		file: File;
		fileSuffix?: string;
		submitAction: Action;
		fieldsToSet?: Record<string, any>;
		skipBlob?: boolean;
	}): Promise<{ error?: string }> {
		const formData = new FormData();
		formData.set("analysis_run_name", analysis_run_name);
		for (const [key, val] of Object.entries(fieldsToSet)) {
			formData.set(key, val);
		}

		let blob = {} as PutBlobResult;

		let error;

		try {
			if (skipBlob) {
				formData.set("file", file);
			} else {
				//upload file to blob store
				//TODO: make it so access isn't public
				blob = await upload(file.name, file, {
					access: "public",
					handleUploadUrl: "/api/analysisFile/upload",
					multipart: true
				});
				formData.set("url", blob.url);
			}

			//send request
			const response = await submitAction(formData);
			if (response.statusMessage === "error") {
				setErrorObj({
					[`${analysis_run_name}${fileSuffix}`]: response.error
				});
				error = response.error;
			} else if (response.statusMessage === "success") {
				setResponseObj({
					[`${analysis_run_name}${fileSuffix}`]: response.result
				});
			} else {
				setErrorObj({
					[`${analysis_run_name}${fileSuffix}`]: "Unknown error."
				});
				error = "Unknown error.";
			}
		} catch (err) {
			setErrorObj({
				[`${analysis_run_name}${fileSuffix}`]: `Error: ${(err as Error).message}.`
			});
			error = `Error: ${(err as Error).message}.`;
		}

		if (!skipBlob) {
			// delete file from blob store
			await fetch(`/api/analysisFile/delete?url=${blob.url}`, {
				method: "DELETE"
			});
		}

		return { error };
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, files } = e.target;
		// If this is the first metadata file (when analysis name is \u200b)
		if (analyses.includes("\u200b") && !name.includes("_assign") && !name.includes("_occ")) {
			setFileStates((prev) => ({
				...prev,
				"\u200b": files?.[0] || null,
				[name]: files?.[0] || null // Also store under the actual name
			}));
		} else {
			setFileStates((prev) => ({
				...prev,
				[name]: files?.[0] || null
			}));
		}
	};

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitted) return;

		setResponseObj({ reset: "true" });
		setErrorObj({ reset: "true" });
		setLoading("");
		setSubmitted(true);

		const allFormData = new FormData(event.currentTarget);
		let hasError = false;

		let analysis_i = 0;
		for (const analysis_run_name of analyses) {
			if (analysis_run_name && analysis_run_name !== "\u200b") {
				//analysis file
				setLoading(analysis_run_name);
				const element = document.getElementById(`analysis_${analysis_i}`);
				if (element) {
					element.scrollIntoView({
						block: "start",
						behavior: "smooth"
					});
				}

				const { error: analysisError } = await analysisFileSubmit({
					analysis_run_name,
					file: allFormData.get(analysis_run_name) as File,
					submitAction: analysisSubmitAction,
					fieldsToSet: { isPrivate },
					skipBlob: true
				});

				if (analysisError) {
					hasError = true;
					setIsError(true);
					setModalMessage(analysisError);
					modalRef.current?.showModal();
					setErrorObj({
						global: analysisError,
						status: "❌ Submission Failed"
					});
					setSubmitted(false);
					break;
				}

				//assignments file
				setLoading(`${analysis_run_name}_assign`);
				const { error: assignError } = await analysisFileSubmit({
					analysis_run_name,
					file: allFormData.get(`${analysis_run_name}_assign`) as File,
					fileSuffix: "_assign",
					submitAction: assignSubmitAction,
					fieldsToSet: {
						analysis_run_name,
						isPrivate
					}
				});

				if (assignError) {
					//TODO: fix deleting the analysis
					//remove analysis from database
					await dbDelete(analysisDeleteAction, analysis_run_name);

					hasError = true;
					setIsError(true);
					setModalMessage(assignError);
					modalRef.current?.showModal();
					setErrorObj({
						global: assignError,
						status: "❌ Submission Failed"
					});
					setSubmitted(false);
					break;
				}

				//occurrences file
				setLoading(`${analysis_run_name}_occ`);
				const { error: occError } = await analysisFileSubmit({
					analysis_run_name,
					file: allFormData.get(`${analysis_run_name}_occ`) as File,
					fileSuffix: "_occ",
					submitAction: occSubmitAction,
					fieldsToSet: {
						analysis_run_name,
						isPrivate
					}
				});

				if (occError) {
					console.log("occError");
					//TODO: fix deleting the analysis
					await dbDelete(analysisDeleteAction, analysis_run_name);
					//remove analyses, features, and taxonomies from database
					// await dbDelete(analysisDeleteAction, analysisResult!.analysis_run_name, {
					// 	dbFeatures: assignResult!.dbFeatures,
					// 	dbTaxonomies: assignResult!.dbTaxonomies
					// });

					hasError = true;
					setIsError(true);
					setModalMessage(occError);
					setErrorObj({
						global: occError,
						status: "❌ Submission Failed"
					});
					modalRef.current?.showModal();
					setSubmitted(false);
					break;
				}
			}

			analysis_i++;
		}

		if (!hasError) {
			const successMessage =
				"Analysis successfully submitted! You will be redirected to the project page in 5 seconds...";
			setIsError(false);
			setModalMessage(successMessage);
			modalRef.current?.showModal();
			modalXRef.current!.disabled = true;
			modalClickOffRef.current!.disabled = true;
			setResponseObj({
				global: successMessage,
				status: "✅ Analysis Submission Successful"
			});

			setTimeout(() => {
				router.push(`/explore/project`);
			}, 5000);
		}

		setLoading("");
	}

	// To Carter: there is a rare case where the submit button is disabled if you delete an analysis
	const handleDeleteAnalysis = (i: number) => {
		const analysisToDelete = analyses[i];

		// Update analyses array
		setAnalyses((prev) => {
			const newAnalyses = [...prev];
			// TODO: This is what's causing the Submit button to remain disabled after you delete an analysis. It uses "\u200b" instead of null to maintain an order to the analyses array. Changing it to "\u200b" causes other bugs that need to be resolved to fix everything.
			newAnalyses[i] = null;
			if (newAnalyses.every((e) => e === "\u200b" || e === null)) {
				setProject(null);
			}
			return newAnalyses;
		});

		// Clean up fileStates
		setFileStates((prev) => {
			const newState = { ...prev };
			if (analysisToDelete) {
				delete newState[analysisToDelete];
				delete newState[`${analysisToDelete}_assign`];
				delete newState[`${analysisToDelete}_occ`];
			}
			return newState;
		});
	};

	return (
		<>
			{project && (
				<div className="text-center w-full">
					Analyses for project:{" "}
					<Link className="link link-primary" href={`/explore/project/${project.project_id}`}>
						{project.project_id}
					</Link>
				</div>
			)}

			<form className="card-body w-full max-w-4xl mx-auto" onSubmit={handleSubmit}>
				<div className="space-y-6 -mt-8">
					<fieldset className="fieldset bg-base-100">
						<label className="fieldset-label flex gap-2">
							<input
								name="isPrivate"
								type="checkbox"
								className="checkbox"
								checked={isPrivate}
								onChange={(e) => setIsPrivate(e.currentTarget.checked)}
								disabled={!!loading || project?.isPrivate || false}
							/>
							<div>Private submission</div>
							<InfoButton infoText="" />
						</label>
					</fieldset>

					{analyses.map(
						(a, i) =>
							a && (
								<div key={i} id={`analysis_${i}`} className="card bg-base-100 shadow-sm p-6 relative">
									{analyses[i] && (
										<div className="space-y-4">
											<h2 className="text-xl font-semibold text-base-content mb-4">
												{analyses[i] === "\u200b" ? "New Analysis" : analyses[i]}
											</h2>

											<div className="space-y-4">
												<div className="flex items-center gap-3">
													<label className="form-control w-full">
														<div className="label">
															<span className="label-text text-base-content">Analysis Metadata File:</span>
														</div>
														<input
															type="file"
															name={analyses[i]}
															required
															disabled={!!loading}
															accept=".tsv"
															onChange={(e) => {
																handleFileChange(e);
																parseAnalysis(e.currentTarget, i);
															}}
															className="file-input file-input-bordered file-input-primary bg-base-100 w-full [&::file-selector-button]:text-white"
														/>
													</label>
													<div className="flex items-center self-end mb-[10.5px]">
														<ProgressCircle
															response={responseObj[analyses[i]]}
															error={errorObj[analyses[i]]}
															loading={loading === analyses[i]}
															hasFile={!!fileStates["\u200b"] || !!fileStates[analyses[i]]}
														/>
													</div>
												</div>

												<div className="flex items-center gap-3">
													<label className="form-control w-full">
														<div className="label">
															<span className="label-text text-base-content">ASV Taxa/Features File:</span>
														</div>
														<input
															type="file"
															name={`${analyses[i]}_assign`}
															required
															disabled={!!loading}
															accept=".tsv"
															onChange={handleFileChange}
															className="file-input file-input-bordered file-input-primary bg-base-100 w-full [&::file-selector-button]:text-white"
														/>
													</label>
													<div className="flex items-center self-end mb-[10.5px]">
														<ProgressCircle
															response={responseObj[`${analyses[i]}_assign`]}
															error={errorObj[`${analyses[i]}_assign`]}
															loading={loading === `${analyses[i]}_assign`}
															hasFile={!!fileStates[`${analyses[i]}_assign`]}
														/>
													</div>
												</div>

												<div className="flex items-center gap-3">
													<label className="form-control w-full">
														<div className="label">
															<span className="label-text text-base-content">Occurrence Table File:</span>
														</div>
														<input
															type="file"
															name={`${analyses[i]}_occ`}
															required
															disabled={!!loading}
															accept=".tsv"
															onChange={handleFileChange}
															className="file-input file-input-bordered file-input-primary bg-base-100 w-full [&::file-selector-button]:text-white"
														/>
													</label>
													<div className="flex items-center self-end mb-[10.5px]">
														<ProgressCircle
															response={responseObj[`${analyses[i]}_occ`]}
															error={errorObj[`${analyses[i]}_occ`]}
															loading={loading === `${analyses[i]}_occ`}
															hasFile={!!fileStates[`${analyses[i]}_occ`]}
														/>
													</div>
												</div>
											</div>
										</div>
									)}

									{analyses.filter((a) => a !== null).length > 1 && (
										<button
											className="btn btn-sm absolute top-4 right-4 bg-base-200 hover:bg-base-200/80"
											type="button"
											disabled={!!loading}
											onClick={() => {
												handleDeleteAnalysis(i);
											}}
										>
											<span className="text-base-content">×</span>
										</button>
									)}
								</div>
							)
					)}

					{analyses[analyses.length - 1] !== "\u200b" && (
						<div className="flex justify-center">
							<button
								className="btn btn-sm bg-base-300 hover:bg-base-200 text-base-content shadow-sm"
								type="button"
								disabled={!!loading}
								onClick={() => setAnalyses([...analyses, "\u200b"])}
							>
								<span className="text-base-content">+</span> Add Another Analysis to Submission
							</button>
						</div>
					)}

					<div className="flex justify-center mt-8">
						<button
							className="btn btn-primary text-white w-[200px]"
							disabled={!!loading || submitted || !analyses.every((a) => a && checkAnalysisFiles(a, fileStates))}
						>
							{loading || submitted ? <span className="loading loading-spinner loading-sm"></span> : "Submit"}
						</button>
					</div>
				</div>
			</form>

			<dialog ref={modalRef} className="modal">
				<div className="modal-box">
					<button
						ref={modalXRef}
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={(e) => {
							e.preventDefault();
							modalRef.current?.close();
						}}
					>
						✕
					</button>
					<h3 className={`text-lg font-bold mb-2 ${isError ? "text-error" : "text-success"}`}>
						{isError ? "Submission Failed" : "Analysis Submitted Successfully"}
					</h3>
					<p className="mb-2 font-light whitespace-pre-wrap">{modalMessage}</p>
					{!isError && (
						<div className="mt-4 flex items-center justify-center gap-2">
							<span className="loading loading-spinner loading-sm"></span>
							<span className="text-base-content/80 text-sm">Redirecting...</span>
						</div>
					)}
				</div>
				<form method="dialog" className="modal-backdrop">
					<button ref={modalClickOffRef}>close</button>
				</form>
			</dialog>

			{/* Status Messages */}
			<div className="flex-grow mt-8">
				{(responseObj.status || errorObj.status) && (
					<div
						className={`
						p-6 rounded-lg mx-auto max-w-lg
						${errorObj.status ? "bg-error/10 border-2 border-error" : "bg-success/10 border-2 border-success"}
					`}
					>
						<h3 className={`text-lg font-bold mb-2 ${errorObj.status ? "text-error" : "text-success"}`}>
							{errorObj.status ? "Analysis Submission Failed" : "Analysis Submitted Successfully"}
						</h3>
						<p className="text-base text-base-content">
							{errorObj.status
								? errorObj.global
								: "Please stay on this page. You will be redirected to the explore page in a few seconds..."}
						</p>
						{responseObj.status && (
							<div className="mt-4 flex items-center justify-center gap-2">
								<span className="loading loading-spinner loading-sm"></span>
								<span className="text-base-content/80 text-sm">Redirecting...</span>
							</div>
						)}
					</div>
				)}
			</div>

			{!!loading && (
				<div className="text-center mt-1 text-base-content/80">Loading, please do not close the website</div>
			)}
		</>
	);
}
