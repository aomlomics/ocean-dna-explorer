"use client";

import { Analysis, Project, Tag } from "@/app/generated/prisma/client";
import { ReactNode, useRef, useState } from "react";
import Modal from "../Modal";
import { NetworkProgressPacket } from "@/types/globals";
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

export default function AnalysisEditButton({
	analysis: {
		analysis_run_name,
		isPrivate,
		trusted,
		analysisMetadataFileUrl_ODE,
		asvFileUrl_ODE,
		occurrenceFileUrl_ODE,
		Tags: currentTags
	},
	project_id,
	isPrivateDisabled,
	tags
}: {
	analysis: {
		analysis_run_name: Analysis["analysis_run_name"];
		isPrivate: Analysis["isPrivate"];
		trusted: Analysis["trusted"];
		analysisMetadataFileUrl_ODE: Analysis["analysisMetadataFileUrl_ODE"];
		asvFileUrl_ODE: Analysis["asvFileUrl_ODE"];
		occurrenceFileUrl_ODE: Analysis["occurrenceFileUrl_ODE"];
		Tags: Tag[];
	};
	project_id: Project["project_id"];
	isPrivateDisabled: boolean;
	tags: Tag[];
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	//state variable that will have any error passed to it
	const [errorMessage, setErrorMessage] = useState("");

	//refs for popup modal
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	//file input refs to clear inputs after submission
	const analysisRef = useRef<HTMLInputElement>(null);
	const assignmentsRef = useRef<HTMLInputElement>(null);
	const occurrencesRef = useRef<HTMLInputElement>(null);

	//state variables to hold contents of form for disabling submit button
	const [isPrivateToggle, setIsPrivateToggle] = useState(isPrivate);
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

	function finishSubmit() {
		modalXRef.current!.disabled = false;
		modalClickOffRef.current!.disabled = false;
		setLoading(false);
	}

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		modalXRef.current!.disabled = true;
		modalClickOffRef.current!.disabled = true;

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
					await upload(`submissions/${analysisFile.name}`, analysisFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: analysisFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setAnalysisResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

				const argsObj = { url: analysisUrl } as {
					url?: string;
					isPrivate?: boolean;
					trusted?: boolean;
					tagNames?: string[];
				};
				if (isPrivateToggle !== isPrivate) {
					argsObj.isPrivate = isPrivateToggle;
				}
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
					//delete file from blob storage
					await fetch(`/api/file/delete?url=${analysisUrl}`, {
						method: "DELETE"
					});

					setErrorMessage(analysisError);
					finishSubmit();

					return;
				}

				//remove file from input after done
				if (analysisResponse?.statusMessage === "success" && analysisRef.current) {
					analysisRef.current.value = "";
					setAnalysisFile(undefined);
				}
			}

			if (!analysisFile && (tagsAreChanged || isPrivateToggle !== isPrivate || trustedToggle !== trusted)) {
				const argsObj = {} as {
					isPrivate?: boolean;
					trusted?: boolean;
					tagNames?: string[];
				};
				if (isPrivateToggle !== isPrivate) {
					argsObj.isPrivate = isPrivateToggle;
				}
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
					setErrorMessage(analysisError);
					finishSubmit();

					return;
				}
			}

			//assignments submit
			if (assignmentsFile) {
				//upload file to blob storage
				setAssignResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				const assignmentsUrl = (
					await upload(`submissions/${assignmentsFile.name}`, assignmentsFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: assignmentsFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setAssignResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

				//submit assignments file url
				const assignmentsError = await doProgressAction({
					action: assignEditAction,
					setter: setAssignResponse,
					args: [assignmentsUrl, editId, analysis_run_name]
				});

				//handle errors
				if (assignmentsError) {
					//delete file from blob storage
					await fetch(`/api/file/delete?url=${assignmentsUrl}`, {
						method: "DELETE"
					});

					setErrorMessage(assignmentsError);
					finishSubmit();

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
					await upload(`submissions/${occurrencesFile.name}`, occurrencesFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
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
					args: [occurrencesUrl, editId, analysis_run_name]
				});

				//handle errors
				if (occurrencesError) {
					//delete file from blob storage
					await fetch(`/api/file/delete?url=${occurrencesUrl}`, {
						method: "DELETE"
					});

					setErrorMessage(occurrencesError);
					finishSubmit();

					return;
				}

				//remove file from input after done
				if (occResponse?.statusMessage === "success" && occurrencesRef.current) {
					occurrencesRef.current.value = "";
					setOccurrencesFile(undefined);
				}
			}

			//reset page
			finishSubmit();
			router.refresh();
		} catch (err) {
			const error = err as Error;

			setErrorMessage(error.message);
			finishSubmit();

			return;
		}
	}

	return (
		<>
			<button
				className="btn btn-sm bg-primary text-neutral-content hover:bg-info"
				onClick={() => modalRef.current?.showModal()}
			>
				Edit
			</button>
			<Modal ref={modalRef} xRef={modalXRef} clickOffRef={modalClickOffRef}>
				<form onSubmit={onSubmit} className="flex flex-col gap-3">
					<h2>Edit Analysis: {analysis_run_name}</h2>
					<fieldset className="fieldset">
						<legend className="fieldset-legend flex gap-2">
							<h2>isPrivate</h2>
						</legend>
						<input
							type="checkbox"
							className="checkbox checkbox-primary"
							disabled={isPrivateDisabled}
							checked={isPrivateToggle}
							onChange={(e) => setIsPrivateToggle(e.currentTarget.checked)}
						/>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend flex gap-2">
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

					<div className="grid grid-cols-2 gap-4 w-full">
						<fieldset className="fieldset z-10">
							<legend className="fieldset-legend flex-col items-start gap-0">
								Analysis Metadata File:
								<Link href={analysisMetadataFileUrl_ODE} className="link link-primary link-hover whitespace-nowrap w-0">
									{getSubmissionFileName(analysisMetadataFileUrl_ODE)}
								</Link>
							</legend>
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setAnalysisFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
								ref={analysisRef}
							/>
						</fieldset>
						<ProgressBar loading={loading && !!analysisFile} data={analysisResponse} />

						<fieldset className="fieldset z-10">
							<legend className="fieldset-legend flex-col items-start gap-0">
								ASV Taxa/Features File:
								<Link href={asvFileUrl_ODE} className="link link-primary link-hover whitespace-nowrap w-0">
									{getSubmissionFileName(asvFileUrl_ODE)}
								</Link>
							</legend>
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setAssignmentsFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
								ref={assignmentsRef}
							/>
						</fieldset>
						<ProgressBar loading={loading && !!assignmentsFile} data={assignResponse} />

						<fieldset className="fieldset z-10">
							<legend className="fieldset-legend flex-col items-start gap-0">
								Occurrence Table File:
								<Link href={occurrenceFileUrl_ODE} className="link link-primary link-hover whitespace-nowrap w-0">
									{getSubmissionFileName(occurrenceFileUrl_ODE)}
								</Link>
							</legend>
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setOccurrencesFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
								ref={occurrencesRef}
							/>
						</fieldset>
						<ProgressBar loading={loading && !!occurrencesFile} data={occResponse} />

						<button
							type="submit"
							className="btn"
							disabled={
								loading ||
								(!analysisFile &&
									!assignmentsFile &&
									!occurrencesFile &&
									isPrivateToggle === isPrivate &&
									trustedToggle === trusted &&
									!tagsChanged())
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
										<span className="text-white text-xl w-8 aspect-square rounded-full flex items-center justify-center border-2 border-error bg-error/10">
											✕
										</span>
									</div>
								</div>
							)
						)}
					</div>
				</form>
			</Modal>
		</>
	);
}
