"use client";

import { useAuth } from "@clerk/nextjs";
import Modal from "../Modal";
import UserAdder from "../UserAdder";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import ProgressBar from "../ProgressBar";
import projectSubmitAction from "@/app/actions/project/create/projectSubmit";
import { NetworkPacket, NetworkProgressPacket } from "@/types/globals";
import { useRouter } from "next/navigation";
import SubmitFormSection from "./SubmitFormSection";
import { doProgressActionMany } from "@/app/helpers/progress";
import { upload } from "@vercel/blob/client";
import { parse } from "csv-parse";

//TODO: store submission files on upload, attach files to project/analysis, allow editing submissions by uploading replacement files
export default function ProjectSubmit() {
	const { userId } = useAuth();
	const [userIds, setUserIds] = useState([userId] as string[]);

	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const [project_id, setProject_id] = useState("");

	//response state variables that will have information streamed to them
	const [globalResponse, setGlobalResponse] = useState(undefined as NetworkProgressPacket);
	const [projectResponse, setProjectResponse] = useState(undefined as NetworkProgressPacket);
	const [sampleResponse, setSampleResponse] = useState(undefined as NetworkProgressPacket);
	const [libraryResponse, setLibraryResponse] = useState(undefined as NetworkProgressPacket);

	//state variable that will have any error passed to it
	const [errorMessage, setErrorMessage] = useState("");

	//file urls to delete if an error occurs
	const [fileUrls, setFileUrls] = useState([] as string[]);

	//refs for popup modal
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	//detect when there's an error
	useEffect(() => {
		if (projectResponse?.statusMessage === "error") {
			doError(projectResponse.error);
		}
	}, [projectResponse]);
	useEffect(() => {
		if (sampleResponse?.statusMessage === "error") {
			doError(sampleResponse.error);
		}
	}, [sampleResponse]);
	useEffect(() => {
		if (libraryResponse?.statusMessage === "error") {
			doError(libraryResponse.error);
		}
	}, [libraryResponse]);

	//detect when entire submission was successful
	useEffect(() => {
		if (globalResponse?.statusMessage === "success") {
			setLoading(false);
			modalXRef.current!.disabled = true;
			modalClickOffRef.current!.disabled = true;
			modalRef.current?.showModal();
			setTimeout(() => {
				router.push("/submit/analysis");
			}, 5000);
		} else if (globalResponse?.statusMessage === "error") {
			doError(globalResponse.error);
		}
	}, [globalResponse]);

	async function doError(err: string) {
		//delete files from blob storage
		for (const url of fileUrls) {
			await fetch(`/api/file/delete?url=${url}`, {
				method: "DELETE"
			});
		}

		setLoading(false);
		setErrorMessage(err);
		modalRef.current?.showModal();
	}

	//get project_id from projectMetadata file for blob store
	async function handleProjectFile(event: ChangeEvent<HTMLInputElement>) {
		if (event.currentTarget.files && event.currentTarget.files[0]) {
			const file = event.currentTarget.files[0] as File;

			let headers;
			const parser = parse(await file.text(), { columns: true, delimiter: "\t" });
			for await (const record of parser) {
				if (!headers) {
					headers = Object.keys(record);

					//check if headers have term_name
					if (!headers.includes("term_name")) {
						setErrorMessage('No column with title "term_name" found.');
						modalRef.current?.showModal();
						event.target.value = "";
						return;
					}

					//check if headers have project_level
					if (!headers.includes("project_level")) {
						setErrorMessage('No column with title "project_level" found.');
						modalRef.current?.showModal();
						event.target.value = "";
						return;
					}
				}

				if (record.term_name && record.term_name === "project_id") {
					const value = record.project_level;

					if (record.project_level) {
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
							if (json.result[0]) {
								setErrorMessage(`Project with project_id of "${value}" already exists.`);
								modalRef.current?.showModal();
								event.target.value = "";
							} else {
								setProject_id(value);
							}
						}
					} else {
						setErrorMessage('No value found in "project_level" column for project_id.');
						modalRef.current?.showModal();
						event.target.value = "";
					}

					return;
				}
			}
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		//reset page state
		setGlobalResponse(undefined);
		setProjectResponse(undefined);
		setSampleResponse(undefined);
		setLibraryResponse(undefined);
		setErrorMessage("");

		const isPrivate = event.currentTarget.isPrivate.checked;

		const projectFile = event.currentTarget.project.files[0] as File;
		const sampleFile = event.currentTarget.sample.files[0] as File;
		const libraryFile = event.currentTarget.library.files[0] as File;

		try {
			setProjectResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const projectFileUrl = (
				await upload(`submissions/${projectFile.name}`, projectFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload",
					multipart: projectFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setProjectResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			setFileUrls([projectFileUrl]);

			setSampleResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const sampleFileUrl = (
				await upload(`submissions/${sampleFile.name}`, sampleFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload",
					multipart: sampleFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setSampleResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			setFileUrls([projectFileUrl, sampleFileUrl]);

			setLibraryResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const libraryFileUrl = (
				await upload(`submissions/${libraryFile.name}`, libraryFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload",
					multipart: libraryFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setLibraryResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			setFileUrls([projectFileUrl, sampleFileUrl, libraryFileUrl]);

			//trigger streamed action
			await doProgressActionMany(
				projectSubmitAction,
				[setProjectResponse, setSampleResponse, setLibraryResponse],
				setGlobalResponse,
				projectFileUrl,
				sampleFileUrl,
				libraryFileUrl,
				userIds,
				isPrivate
			);
		} catch (err) {
			const error = err as Error;
			doError(error.message);
		}
	}

	return (
		<>
			<form className="flex flex-col items-center gap-5" onSubmit={handleSubmit}>
				<SubmitFormSection
					title="Make submission private"
					info="Only users added to this Project will be able to see private submissions."
				>
					<fieldset className="fieldset bg-base-100">
						<label className="fieldset-label flex gap-2">
							<input name="isPrivate" type="checkbox" className="checkbox" />
							<p>Private submission</p>
						</label>
					</fieldset>
				</SubmitFormSection>

				<SubmitFormSection
					title="Add users to submission"
					info="Users added to this Project are able to submit new Analyses for it, edit it, and delete it."
				>
					<div className="flex flex-col items-center">
						<UserAdder userIds={userIds} setUserIds={setUserIds} />
					</div>
				</SubmitFormSection>

				<SubmitFormSection title="Upload files" className="grid grid-cols-3 items-end gap-4 w-full">
					<fieldset className="fieldset col-2">
						<legend className="fieldset-legend">Project Metadata File:</legend>
						<input
							type="file"
							className="file-input file-input-primary"
							name="project"
							required
							disabled={loading}
							accept=".tsv"
							onChange={handleProjectFile}
						/>
					</fieldset>
					<ProgressBar loading={loading} data={projectResponse} />

					<fieldset className="fieldset col-2">
						<legend className="fieldset-legend">Sample Metadata File:</legend>
						<input
							type="file"
							className="file-input file-input-primary"
							name="sample"
							required
							disabled={loading}
							accept=".tsv"
						/>
					</fieldset>
					<ProgressBar loading={loading} data={sampleResponse} />

					<fieldset className="fieldset col-2">
						<legend className="fieldset-legend">Library (Experiment Run) Metadata File:</legend>
						<input
							type="file"
							className="file-input file-input-primary"
							name="library"
							required
							disabled={loading}
							accept=".tsv"
						/>
					</fieldset>
					<ProgressBar loading={loading} data={libraryResponse} />

					<button className="btn btn-success col-2 justify-self-center" disabled={loading}>
						Submit
					</button>

					{loading ? (
						<div className="flex justify-center">
							<span className="loading loading-spinner loading-xl"></span>
						</div>
					) : (
						globalResponse?.statusMessage === "error" && (
							<div className="flex justify-center">
								<div className="tooltip tooltip-error" data-tip={globalResponse.error}>
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
					{errorMessage ? "Submission Failed" : "Project Submitted Successfully"}
				</h3>
				<p className="mb-2 font-light whitespace-pre-wrap">
					{errorMessage
						? errorMessage
						: "Project successfully submitted! You will be redirected to submit your analysis files in 5 seconds..."}
				</p>
				{globalResponse?.statusMessage === "success" && (
					<div className="mt-4 flex items-center justify-center gap-2">
						<span className="loading loading-spinner loading-sm"></span>
						<span className="text-base-content/80 text-sm">Redirecting...</span>
					</div>
				)}
			</Modal>
		</>
	);
}
