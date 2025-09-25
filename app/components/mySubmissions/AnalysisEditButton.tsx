"use client";

import { Analysis } from "@/app/generated/prisma/client";
import { useRef, useState } from "react";
import Modal from "../Modal";
import { NetworkProgressPacket } from "@/types/globals";
import { upload } from "@vercel/blob/client";
import { doProgressAction } from "@/app/helpers/progress";
import occEditAction from "@/app/actions/analysis/update/occEdit";
import { v4 as uuidv4 } from "uuid";
import analysisEditAction from "@/app/actions/analysis/update/analysisEdit";
import assignEditAction from "@/app/actions/analysis/update/assignEdit";
import ProgressBar from "../ProgressBar";

export default function AnalysisEditButton({
	analysis_run_name,
	isPrivate,
	isPrivateDisabled
}: {
	analysis_run_name: Analysis["analysis_run_name"];
	isPrivate: Analysis["isPrivate"];
	isPrivateDisabled: boolean;
}) {
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
	const [analysisFile, setAnalysisFile] = useState(undefined as File | undefined);
	const [assignmentsFile, setAssignmentsFile] = useState(undefined as File | undefined);
	const [occurrencesFile, setOccurrencesFile] = useState(undefined as File | undefined);

	//response state variables that will have information streamed to them
	const [analysisResponse, setAnalysisResponse] = useState(undefined as NetworkProgressPacket);
	const [assignResponse, setAssignResponse] = useState(undefined as NetworkProgressPacket);
	const [occResponse, setOccResponse] = useState(undefined as NetworkProgressPacket);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		modalXRef.current!.disabled = true;
		modalClickOffRef.current!.disabled = true;

		setLoading(true);

		//reset page state
		setAnalysisResponse(undefined);
		setAssignResponse(undefined);
		setOccResponse(undefined);

		//TODO: allow user to only change isPrivate
		if (!analysisFile && !assignmentsFile && !occurrencesFile) {
			setErrorMessage("Must provide at least one file.");
			setLoading(false);
			return;
		}

		try {
			//trusting client with this because they are authenticated and can only edit their own submissions anyways. if they want to break their own submissions' edit histories then so be it
			const editId = uuidv4();

			//analysis submit
			if (analysisFile) {
				//upload file to blob storage
				setAnalysisResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 5 } });

				const analysisUrl = (
					await upload(`submissions/${analysisFile.name}`, analysisFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: analysisFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				//submit analysis file url
				const analysisError = await doProgressAction({
					action: analysisEditAction,
					setter: setAnalysisResponse,
					args: [analysisUrl, editId, analysis_run_name, isPrivateToggle]
				});

				//handle errors
				if (analysisError) {
					//delete file from blob storage
					await fetch(`/api/file/delete?url=${analysisUrl}`, {
						method: "DELETE"
					});

					setErrorMessage(analysisError);
					setLoading(false);

					return;
				}

				//remove file from input after done
				if (analysisResponse?.statusMessage === "success") {
					analysisRef.current!.value = "";
				}

				//TODO: notify user that this edit has been completed successfully and does not need to run again
			}

			//assignments submit
			if (assignmentsFile) {
				//upload file to blob storage
				setAssignResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 5 } });
				const assignmentsUrl = (
					await upload(`submissions/${assignmentsFile.name}`, assignmentsFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: assignmentsFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

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
					setLoading(false);

					return;
				}

				//remove file from input after done
				if (assignResponse?.statusMessage === "success") {
					assignmentsRef.current!.value = "";
				}

				//TODO: notify user that this edit has been completed successfully and does not need to run again
			}

			//occurrences submit
			if (occurrencesFile) {
				//upload file to blob storage
				setOccResponse({
					statusMessage: "progress",
					progress: { message: "Uploading file", value: 5 }
				});

				const occurrencesUrl = (
					await upload(`submissions/${occurrencesFile.name}`, occurrencesFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: occurrencesFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

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
					setLoading(false);

					return;
				}

				//remove file from input after done
				if (occResponse?.statusMessage === "success") {
					occurrencesRef.current!.value = "";
				}

				//TODO: notify user that this edit has been completed successfully and does not need to run again
			}
		} catch (err) {
			const error = err as Error;

			setErrorMessage(error.message);
			setLoading(false);

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
			<Modal ref={modalRef}>
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

					<div className="grid grid-cols-2 gap-4 w-full">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Project Metadata File:</legend>
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setAnalysisFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
							/>
						</fieldset>
						<ProgressBar loading={loading} data={analysisResponse} />

						<fieldset className="fieldset">
							<legend className="fieldset-legend">Sample Metadata File:</legend>
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setAssignmentsFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
							/>
						</fieldset>
						<ProgressBar loading={loading} data={assignResponse} />

						<fieldset className="fieldset">
							<legend className="fieldset-legend">Library (Experiment Run) Metadata File:</legend>
							<input
								type="file"
								className="file-input file-input-primary"
								disabled={loading}
								accept=".tsv"
								onChange={(e) => setOccurrencesFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
							/>
						</fieldset>
						<ProgressBar loading={loading} data={occResponse} />

						<button
							type="submit"
							className="btn"
							disabled={loading || (!analysisFile && !assignmentsFile && !occurrencesFile)}
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
