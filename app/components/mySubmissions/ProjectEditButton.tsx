"use client";

import { Project } from "@/app/generated/prisma/client";
import { SetStateAction, useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import ProgressBar from "../ProgressBar";
import { NetworkProgressPacket } from "@/types/globals";
import projectEditAction from "@/app/actions/project/update/projectEdit";
import { doProgressActionManyGlobal } from "@/app/helpers/progress";
import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { getSubmissionFileName } from "@/app/helpers/utils";
import { useRouter } from "next/navigation";
import projectUpdateImageAction from "@/app/actions/project/update/projectUpdateImage";
import AddImageButton from "../AddImageButton";

export default function ProjectEditButton({
	project_id,
	imageFileUrl_ODE,
	projectMetadataFileUrl_ODE,
	sampleMetadataFileUrl_ODE,
	libraryMetadataFileUrl_ODE
}: {
	project_id: Project["project_id"];
	imageFileUrl_ODE: Project["imageFileUrl_ODE"];
	projectMetadataFileUrl_ODE: Project["projectMetadataFileUrl_ODE"];
	sampleMetadataFileUrl_ODE: Project["sampleMetadataFileUrl_ODE"];
	libraryMetadataFileUrl_ODE: Project["libraryMetadataFileUrl_ODE"];
}) {
	const router = useRouter();

	const [loading, setLoading] = useState(false);

	//file input refs to clear inputs after submission
	const projectRef = useRef<HTMLInputElement>(null);
	const sampleRef = useRef<HTMLInputElement>(null);
	const libraryRef = useRef<HTMLInputElement>(null);

	//state variables to hold contents of form for disabling submit button
	const [projectFile, setProjectFile] = useState(undefined as File | undefined);
	const [sampleFile, setSampleFile] = useState(undefined as File | undefined);
	const [libraryFile, setLibraryFile] = useState(undefined as File | undefined);

	//response state variables that will have information streamed to them
	const [globalResponse, setGlobalResponse] = useState(undefined as NetworkProgressPacket);
	const [projectResponse, setProjectResponse] = useState(undefined as NetworkProgressPacket);
	const [sampleResponse, setSampleResponse] = useState(undefined as NetworkProgressPacket);
	const [libraryResponse, setLibraryResponse] = useState(undefined as NetworkProgressPacket);
	const [_, setFillerResponse] = useState(undefined as NetworkProgressPacket);

	//refs for popup modal
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	//detect when entire submission was successful
	useEffect(() => {
		if (globalResponse?.statusMessage === "success") {
			if (projectRef.current && sampleRef.current && libraryRef.current) {
				projectRef.current.value = "";
				setProjectFile(undefined);
				sampleRef.current.value = "";
				setSampleFile(undefined);
				libraryRef.current.value = "";
				setLibraryFile(undefined);
			}

			modalXRef.current!.disabled = false;
			modalClickOffRef.current!.disabled = false;
			router.refresh();
		}
		setLoading(false);
	}, [globalResponse]);

	async function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		modalXRef.current!.disabled = true;
		modalClickOffRef.current!.disabled = true;

		setLoading(true);

		//reset page state
		setGlobalResponse(undefined);
		setProjectResponse(undefined);
		setSampleResponse(undefined);
		setLibraryResponse(undefined);

		const args = { project_id } as {
			project_id: Project["project_id"];
			projectFileUrl?: Project["projectMetadataFileUrl_ODE"];
			sampleFileUrl?: Project["sampleMetadataFileUrl_ODE"];
			libraryFileUrl?: Project["libraryMetadataFileUrl_ODE"];
			imageFileUrl?: Project["imageFileUrl_ODE"];
		};

		if (!projectFile && !sampleFile && !libraryFile) {
			setGlobalResponse({ statusMessage: "error", error: "Must provide at least one file." });

			setLoading(false);
			return;
		}

		try {
			const setters = [] as ((value: SetStateAction<NetworkProgressPacket>) => void)[];

			if (projectFile) {
				setProjectResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				setters.push(setProjectResponse);
				args.projectFileUrl = (
					await upload(`submissions/${projectFile.name}`, projectFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: projectFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setProjectResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			} else {
				setters.push(setFillerResponse);
			}

			if (sampleFile) {
				setSampleResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				setters.push(setSampleResponse);
				args.sampleFileUrl = (
					await upload(`submissions/${sampleFile.name}`, sampleFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: sampleFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setSampleResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			} else {
				setters.push(setFillerResponse);
			}

			if (libraryFile) {
				setLibraryResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });

				setters.push(setLibraryResponse);
				args.libraryFileUrl = (
					await upload(`submissions/${libraryFile.name}`, libraryFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload",
						multipart: libraryFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
					})
				).url;

				setLibraryResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });
			} else {
				setters.push(setFillerResponse);
			}

			//trigger streamed action
			await doProgressActionManyGlobal(projectEditAction, setters, setGlobalResponse, args);
		} catch (err) {
			setLoading(false);
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
				<h2 className="mb-3">Edit Project: {project_id}</h2>

				<fieldset className="fieldset">
					<legend className="fieldset-legend flex-col items-start gap-0">
						Cover Image:
						{imageFileUrl_ODE ? (
							<Link href={imageFileUrl_ODE} className="link link-primary link-hover">
								{getSubmissionFileName(imageFileUrl_ODE)}
							</Link>
						) : (
							<></>
						)}
					</legend>
					<div className="grid grid-cols-2 gap-4">
						<AddImageButton title={"Replace with New Image"} project_id={project_id} />
						<button
							className="btn btn-error"
							onClick={async () => setGlobalResponse(await projectUpdateImageAction(project_id, null))}
							disabled={loading || !imageFileUrl_ODE}
						>
							DELETE IMAGE
						</button>
					</div>
				</fieldset>

				<form onSubmit={onSubmit} className="flex flex-col gap-3">
					<h1 className="text-2xl text-primary border-b border-primary">Metadata Files:</h1>
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
								onChange={(e) => setProjectFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
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
								onChange={(e) => setSampleFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
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
								onChange={(e) => setLibraryFile(e.currentTarget.files ? e.currentTarget.files[0] : undefined)}
								ref={libraryRef}
							/>
							<ProgressBar loading={loading && !!libraryFile} data={libraryResponse} />
						</div>
					</fieldset>

					<button type="submit" className="btn" disabled={loading || (!projectFile && !sampleFile && !libraryFile)}>
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
				</form>
			</Modal>
		</>
	);
}
