"use client";

import type { ProjectModel } from "@/app/generated/prisma/models/Project";
import { useRef, useState } from "react";
import Modal from "../Modal";
import ProgressBar from "../ProgressBar";
import type { NetworkProgressPacket } from "@/types/globals";
import projectEditAction from "@/app/actions/project/update/projectEdit";
import { doProgressActionManyGlobal } from "@/app/helpers/progress";
import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { getSubmissionFileName } from "@/app/helpers/utils";
import { useRouter } from "next/navigation";
import projectUpdateImageAction from "@/app/actions/project/update/projectUpdateImage";
import AddImageButton from "../AddImageButton";
import ProjectCoverPhotoPreview from "../explore/ProjectCoverPhotoPreview";

export default function ProjectEditForm({
	project_id,
	imageFileUrl_ODE,
	projectMetadataFileUrl_ODE,
	sampleMetadataFileUrl_ODE,
	libraryMetadataFileUrl_ODE
}: {
	project_id: ProjectModel["project_id"];
	imageFileUrl_ODE: ProjectModel["imageFileUrl_ODE"];
	projectMetadataFileUrl_ODE: ProjectModel["projectMetadataFileUrl_ODE"];
	sampleMetadataFileUrl_ODE: ProjectModel["sampleMetadataFileUrl_ODE"];
	libraryMetadataFileUrl_ODE: ProjectModel["libraryMetadataFileUrl_ODE"];
}) {
	const router = useRouter();

	const [loading, setLoading] = useState(false);

	const errorRef = useRef<HTMLDialogElement>(null);
	const [errorMessage, setErrorMessage] = useState("");

	//file input refs to clear inputs after submission
	const projectRef = useRef<HTMLInputElement>(null);
	const sampleRef = useRef<HTMLInputElement>(null);
	const libraryRef = useRef<HTMLInputElement>(null);

	//state variables to hold contents of form for disabling submit button
	const [projectFile, setProjectFile] = useState(undefined as File | undefined);
	const [sampleFile, setSampleFile] = useState(undefined as File | undefined);
	const [libraryFile, setLibraryFile] = useState(undefined as File | undefined);

	//response state variables that will have information streamed to them
	const [globalResponse, setGlobalResponse] = useState(undefined as NetworkProgressPacket | undefined);
	const [projectResponse, setProjectResponse] = useState(undefined as NetworkProgressPacket | undefined);
	const [sampleResponse, setSampleResponse] = useState(undefined as NetworkProgressPacket | undefined);
	const [libraryResponse, setLibraryResponse] = useState(undefined as NetworkProgressPacket | undefined);

	function doError(err: string) {
		setLoading(false);
		setErrorMessage(err);
		errorRef.current?.showModal();
	}

	function updateResponse(setter: (res: NetworkProgressPacket) => void, res: NetworkProgressPacket) {
		setter(res);

		if (res?.statusMessage === "error") {
			doError(res.error);
		}
	}

	function handleGlobalResponse(res: NetworkProgressPacket) {
		setGlobalResponse(res);

		if (res?.statusMessage === "success") {
			if (projectRef.current && sampleRef.current && libraryRef.current) {
				projectRef.current.value = "";
				setProjectFile(undefined);
				sampleRef.current.value = "";
				setSampleFile(undefined);
				libraryRef.current.value = "";
				setLibraryFile(undefined);
			}

			setLoading(false);
			router.refresh();
		} else if (res?.statusMessage === "error") {
			doError(res.error);
		}
	}

	async function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		setLoading(true);

		//reset page state
		setGlobalResponse(undefined);
		setProjectResponse(undefined);
		setSampleResponse(undefined);
		setLibraryResponse(undefined);

		const args = { project_id } as {
			project_id: ProjectModel["project_id"];
			projectFileUrl?: ProjectModel["projectMetadataFileUrl_ODE"];
			sampleFileUrl?: ProjectModel["sampleMetadataFileUrl_ODE"];
			libraryFileUrl?: ProjectModel["libraryMetadataFileUrl_ODE"];
			imageFileUrl?: ProjectModel["imageFileUrl_ODE"];
		};

		if (!projectFile && !sampleFile && !libraryFile) {
			setGlobalResponse({ statusMessage: "error", error: "Must provide at least one file." });

			setLoading(false);
			return;
		}

		try {
			const setters = [] as ((value: NetworkProgressPacket) => void)[];

			if (projectFile) {
				setProjectResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				setters.push((res) => updateResponse(setProjectResponse, res));
				args.projectFileUrl = (
					await upload(`submissions/${encodeURIComponent(projectFile.name)}`, projectFile, {
						access: "public",
						handleUploadUrl: "/api/internal/file/upload",
						multipart: projectFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setProjectResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			} else {
				setters.push(() => {});
			}

			if (sampleFile) {
				setSampleResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				setters.push((res) => updateResponse(setSampleResponse, res));
				args.sampleFileUrl = (
					await upload(`submissions/${encodeURIComponent(sampleFile.name)}`, sampleFile, {
						access: "public",
						handleUploadUrl: "/api/internal/file/upload",
						multipart: sampleFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setSampleResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			} else {
				setters.push(() => {});
			}

			if (libraryFile) {
				setLibraryResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				setters.push((res) => updateResponse(setLibraryResponse, res));
				args.libraryFileUrl = (
					await upload(`submissions/${encodeURIComponent(libraryFile.name)}`, libraryFile, {
						access: "public",
						handleUploadUrl: "/api/internal/file/upload",
						multipart: libraryFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setLibraryResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			} else {
				setters.push(() => {});
			}

			//trigger streamed action
			await doProgressActionManyGlobal(projectEditAction, setters, handleGlobalResponse, args);
		} catch {
			setLoading(false);
		}
	}

	return (
		<div>
			<fieldset className="fieldset">
				<legend className="fieldset-legend flex-col items-start gap-0">
					{imageFileUrl_ODE ? (
						<div className="flex gap-5">
							<div className="flex flex-col">
								Cover Image:
								<Link href={imageFileUrl_ODE} className="link link-primary link-hover">
									{getSubmissionFileName(imageFileUrl_ODE)}
								</Link>
							</div>
							<ProjectCoverPhotoPreview src={imageFileUrl_ODE} title={project_id} />
						</div>
					) : (
						<>Cover Image:</>
					)}
				</legend>

				<div className="grid grid-cols-2 gap-4">
					<AddImageButton title={"Replace with New Image"} target={{ table: "project", value: project_id }} />
					<button
						className="btn btn-error"
						onClick={async () => setGlobalResponse(await projectUpdateImageAction(project_id, null))}
						disabled={loading || !imageFileUrl_ODE}
					>
						DELETE IMAGE
					</button>
				</div>
			</fieldset>

			<form onSubmit={onSubmit} autoComplete="off" className="flex flex-col gap-3">
				<fieldset className="fieldset">
					<legend className="fieldset-legend flex-col items-start gap-0">
						Project Metadata File:
						<Link href={projectMetadataFileUrl_ODE} className="link link-primary link-hover">
							{getSubmissionFileName(projectMetadataFileUrl_ODE)}
						</Link>
					</legend>

					<div className="grid grid-cols-2 gap-4 items-center">
						<input
							type="file"
							className="file-input file-input-primary"
							disabled={loading}
							accept=".tsv"
							onChange={(e) => setProjectFile(e.currentTarget.files?.item(0) ?? undefined)}
							ref={projectRef}
						/>
						<ProgressBar loading={loading && !!projectFile} data={projectResponse} />
					</div>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend flex-col items-start gap-0">
						Sample Metadata File:
						<Link href={sampleMetadataFileUrl_ODE} className="link link-primary link-hover">
							{getSubmissionFileName(sampleMetadataFileUrl_ODE)}
						</Link>
					</legend>

					<div className="grid grid-cols-2 gap-4 items-center">
						<input
							type="file"
							className="file-input file-input-primary"
							disabled={loading}
							accept=".tsv"
							onChange={(e) => setSampleFile(e.currentTarget.files?.item(0) ?? undefined)}
							ref={sampleRef}
						/>
						<ProgressBar loading={loading && !!sampleFile} data={sampleResponse} />
					</div>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend flex-col items-start gap-0">
						Library (Experiment Run) Metadata File:
						<Link href={libraryMetadataFileUrl_ODE} className="link link-primary link-hover">
							{getSubmissionFileName(libraryMetadataFileUrl_ODE)}
						</Link>
					</legend>

					<div className="grid grid-cols-2 gap-4 items-center">
						<input
							type="file"
							className="file-input file-input-primary"
							disabled={loading}
							accept=".tsv"
							onChange={(e) => setLibraryFile(e.currentTarget.files?.item(0) ?? undefined)}
							ref={libraryRef}
						/>
						<ProgressBar loading={loading && !!libraryFile} data={libraryResponse} />
					</div>
				</fieldset>

				<div className="grid grid-cols-2">
					<button
						type="submit"
						className="btn btn-success justify-self-start"
						disabled={loading || (!projectFile && !sampleFile && !libraryFile)}
					>
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
									<span className="text-white text-xl w-8 aspect-square rounded-full flex items-center justify-center border-2 border-error bg-error/10 select-none">
										✕
									</span>
								</div>
							</div>
						)
					)}
				</div>
			</form>

			<Modal ref={errorRef}>
				<h3 className="text-lg font-bold mb-2 text-error">Submission Failed</h3>
				<span className="mb-2 font-light whitespace-pre-wrap">{errorMessage}</span>
			</Modal>
		</div>
	);
}
