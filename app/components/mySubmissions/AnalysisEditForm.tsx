"use client";

import type { AnalysisModel, TagModel } from "@/app/generated/prisma/models";
import { type ReactNode, useRef, useState } from "react";
import Modal from "../Modal";
import type { NetworkProgressPacket } from "@/types/globals";
import { upload } from "@vercel/blob/client";
import { doProgressAction } from "@/app/helpers/progress";
import occEditAction from "@/app/actions/analysis/update/occEdit";
import { v4 as uuidv4 } from "uuid";
import analysisEditAction from "@/app/actions/analysis/update/analysisEdit";
import assignEditAction from "@/app/actions/analysis/update/assignEdit";
import ProgressBar from "../ProgressBar";
import { getSubmissionFileName } from "@/app/helpers/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnalysisTag from "../tags/AnalysisTag";

export default function AnalysisEditForm({
	analysis: {
		project_id,
		analysis_run_name,
		trusted,
		analysisMetadataFileUrl_ODE,
		asvFileUrl_ODE,
		occurrenceFileUrl_ODE,
		Tags: currentTags
	},
	tags
}: {
	analysis: {
		project_id: AnalysisModel["project_id"];
		analysis_run_name: AnalysisModel["analysis_run_name"];
		trusted: AnalysisModel["trusted"];
		analysisMetadataFileUrl_ODE: AnalysisModel["analysisMetadataFileUrl_ODE"];
		asvFileUrl_ODE: AnalysisModel["asvFileUrl_ODE"];
		occurrenceFileUrl_ODE: AnalysisModel["occurrenceFileUrl_ODE"];
		Tags: TagModel[];
	};
	tags: TagModel[];
}) {
	const router = useRouter();

	const [loading, setLoading] = useState(false);

	const errorRef = useRef<HTMLDialogElement>(null);
	const [errorMessage, setErrorMessage] = useState("");

	//file input refs to clear inputs after submission
	const analysisRef = useRef<HTMLInputElement>(null);
	const assignmentsRef = useRef<HTMLInputElement>(null);
	const occurrencesRef = useRef<HTMLInputElement>(null);

	//state variables to hold contents of form for disabling submit button
	const [trustedToggle, setTrustedToggle] = useState(trusted);
	const [selectedTags, setSelectedTags] = useState(currentTags);
	const [analysisFile, setAnalysisFile] = useState(undefined as File | undefined);
	const [assignmentsFile, setAssignmentsFile] = useState(undefined as File | undefined);
	const [occurrencesFile, setOccurrencesFile] = useState(undefined as File | undefined);

	//response state variables that will have information streamed to them
	const [analysisResponse, setAnalysisResponse] = useState(undefined as NetworkProgressPacket);
	const [assignResponse, setAssignResponse] = useState(undefined as NetworkProgressPacket);
	const [occResponse, setOccResponse] = useState(undefined as NetworkProgressPacket);

	function tagsChanged() {
		return !(
			currentTags.length === selectedTags.length &&
			selectedTags.every((st) => currentTags.some((ct) => st.tagName === ct.tagName))
		);
	}

	function doError(err: string) {
		setLoading(false);
		setErrorMessage(err);
		errorRef.current?.showModal();
	}

	async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		setLoading(true);

		//reset page state
		setAnalysisResponse(undefined);
		setAssignResponse(undefined);
		setOccResponse(undefined);

		try {
			//trusting client with this because they are authenticated and can only edit their own submissions anyways. if they want to break their own submissions' edit histories then so be it
			const editId = uuidv4();

			//analysis submit
			const tagsAreChanged = tagsChanged();
			if (analysisFile) {
				//upload file to blob storage
				setAnalysisResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				const analysisUrl = (
					await upload(`submissions/${encodeURIComponent(analysisFile.name)}`, analysisFile, {
						access: "public",
						handleUploadUrl: "/api/internal/file/upload",
						multipart: analysisFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setAnalysisResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

				const argsObj = { url: analysisUrl } as {
					url?: string;
					trusted?: boolean;
					tagNames?: string[];
				};
				if (trustedToggle !== trusted) {
					argsObj.trusted = trustedToggle;
				}
				if (tagsAreChanged) {
					argsObj.tagNames = currentTags.map((t) => t.tagName);
				}

				//submit analysis file url
				const analysisError = await doProgressAction({
					action: analysisEditAction,
					setter: setAnalysisResponse,
					args: [editId, project_id, analysis_run_name, argsObj]
				});

				//handle errors
				if (analysisError) {
					doError(analysisError);

					return;
				}

				//remove file from input after done
				if (analysisResponse?.statusMessage === "success" && analysisRef.current) {
					analysisRef.current.value = "";
					setAnalysisFile(undefined);
				}
			}

			if (!analysisFile && (tagsAreChanged || trustedToggle !== trusted)) {
				const argsObj = {} as {
					trusted?: boolean;
					tagNames?: string[];
				};
				if (trustedToggle !== trusted) {
					argsObj.trusted = trustedToggle;
				}
				if (tagsAreChanged) {
					argsObj.tagNames = selectedTags.map((t) => t.tagName);
				}

				//submit analysis file url
				const analysisError = await doProgressAction({
					action: analysisEditAction,
					setter: undefined,
					args: [editId, project_id, analysis_run_name, argsObj]
				});

				//handle errors
				if (analysisError) {
					doError(analysisError);

					return;
				}
			}

			//assignments submit
			if (assignmentsFile) {
				//upload file to blob storage
				setAssignResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				const assignmentsUrl = (
					await upload(`submissions/${encodeURIComponent(assignmentsFile.name)}`, assignmentsFile, {
						access: "public",
						handleUploadUrl: "/api/internal/file/upload",
						multipart: assignmentsFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setAssignResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

				//submit assignments file url
				const assignmentsError = await doProgressAction({
					action: assignEditAction,
					setter: setAssignResponse,
					args: [assignmentsUrl, editId, project_id, analysis_run_name]
				});

				//handle errors
				if (assignmentsError) {
					doError(assignmentsError);

					return;
				}

				//remove file from input after done
				if (assignResponse?.statusMessage === "success" && assignmentsRef.current) {
					assignmentsRef.current.value = "";
					setAssignmentsFile(undefined);
				}
			}

			//occurrences submit
			if (occurrencesFile) {
				//upload file to blob storage
				setOccResponse({
					statusMessage: "progress",
					progress: { message: "Uploading file", value: 0 }
				});

				const occurrencesUrl = (
					await upload(`submissions/${encodeURIComponent(occurrencesFile.name)}`, occurrencesFile, {
						access: "public",
						handleUploadUrl: "/api/internal/file/upload",
						multipart: occurrencesFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setOccResponse({
					statusMessage: "progress",
					progress: { message: "File uploaded", value: 5 }
				});

				//submit occurrences file url
				const occurrencesError = await doProgressAction({
					action: occEditAction,
					setter: setOccResponse,
					args: [occurrencesUrl, editId, project_id, analysis_run_name]
				});

				//handle errors
				if (occurrencesError) {
					doError(occurrencesError);

					return;
				}

				//remove file from input after done
				if (occResponse?.statusMessage === "success" && occurrencesRef.current) {
					occurrencesRef.current.value = "";
					setOccurrencesFile(undefined);
				}
			}

			//reset page
			setLoading(false);
			router.refresh();
		} catch (err) {
			const error = err as Error;

			doError(error.message);
		}
	}

	return (
		<>
			<form onSubmit={onSubmit} autoComplete="off">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">
						<h2>trusted</h2>
					</legend>
					<input
						type="checkbox"
						className="checkbox checkbox-primary"
						checked={trustedToggle}
						onChange={(e) => setTrustedToggle(e.currentTarget.checked)}
					/>
				</fieldset>

				<div className="flex gap-5 flex-wrap items-center">
					{selectedTags.map((t) => (
						<div key={t.tagName} className="flex gap-1 items-center">
							<AnalysisTag tag={t} />
							<button
								className="btn btn-error btn-sm"
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

				<div className="flex flex-col gap-3">
					<fieldset className="fieldset">
						<legend className="fieldset-legend flex-col items-start gap-0">
							Analysis Metadata File:
							<Link href={analysisMetadataFileUrl_ODE} className="link link-primary link-hover whitespace-nowrap w-0">
								{getSubmissionFileName(analysisMetadataFileUrl_ODE)}
							</Link>
						</legend>

						<div className="grid grid-cols-2 gap-4 items-center">
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setAnalysisFile(e.currentTarget.files?.item(0) ?? undefined)}
								ref={analysisRef}
							/>
							<ProgressBar loading={loading && !!analysisFile} data={analysisResponse} />
						</div>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend flex-col items-start gap-0">
							ASV Taxa/Features File:
							<Link href={asvFileUrl_ODE} className="link link-primary link-hover whitespace-nowrap w-0">
								{getSubmissionFileName(asvFileUrl_ODE)}
							</Link>
						</legend>

						<div className="grid grid-cols-2 gap-4 items-center">
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setAssignmentsFile(e.currentTarget.files?.item(0) ?? undefined)}
								ref={assignmentsRef}
							/>
							<ProgressBar loading={loading && !!assignmentsFile} data={assignResponse} />
						</div>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend flex-col items-start gap-0">
							Occurrence Table File:
							<Link href={occurrenceFileUrl_ODE} className="link link-primary link-hover whitespace-nowrap w-0">
								{getSubmissionFileName(occurrenceFileUrl_ODE)}
							</Link>
						</legend>

						<div className="grid grid-cols-2 gap-4 items-center">
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setOccurrencesFile(e.currentTarget.files?.item(0) ?? undefined)}
								ref={occurrencesRef}
							/>
							<ProgressBar loading={loading && !!occurrencesFile} data={occResponse} />
						</div>
					</fieldset>

					<div className="grid grid-cols-2">
						<button
							type="submit"
							className="btn btn-success justify-self-start"
							disabled={
								loading ||
								(!analysisFile && !assignmentsFile && !occurrencesFile && trustedToggle === trusted && !tagsChanged())
							}
						>
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
										<span className="text-white text-xl w-8 aspect-square rounded-full flex items-center justify-center border-2 border-error bg-error/10 select-none">
											✕
										</span>
									</div>
								</div>
							)
						)}
					</div>
				</div>
			</form>

			<Modal ref={errorRef}>
				<h3 className="text-lg font-bold mb-2 text-error">Submission Failed</h3>
				<span className="mb-2 font-light whitespace-pre-wrap">{errorMessage}</span>
			</Modal>
		</>
	);
}
