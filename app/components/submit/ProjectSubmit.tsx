"use client";

import { useAuth } from "@clerk/nextjs";
import Modal from "../Modal";
import UserAdder from "../UserAdder";
import { SubmitEvent, Fragment, useEffect, useRef, useState } from "react";
import ProgressBar from "../ProgressBar";
import projectSubmitAction from "@/app/actions/project/create/projectSubmit";
import { NetworkProgressPacket } from "@/types/globals";
import { useRouter } from "next/navigation";
import SubmitFormSection from "./SubmitFormSection";
import { doProgressActionManyGlobal } from "@/app/helpers/progress";
import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { Attribution } from "@/app/generated/prismaImages/client";
import ImageSubmitForm, { getAttributionFromForm, getImageFile, getImageFromForm } from "../ImageSubmitForm";

export default function ProjectSubmit() {
	const { userId } = useAuth();
	const [userIds, setUserIds] = useState([userId] as string[]);

	const router = useRouter();
	const [loading, setLoading] = useState(false);

	//state variables for image submission
	const [newAttribution, setNewAttribution] = useState(false);
	const [currAttribution, setCurrAttribution] = useState(undefined as Attribution | undefined);
	const [showCoverImage, setShowCoverImage] = useState(false);

	//response state variables that will have information streamed to them
	const [globalResponse, setGlobalResponse] = useState(undefined as NetworkProgressPacket);
	const [projectResponse, setProjectResponse] = useState(undefined as NetworkProgressPacket);
	const [sampleResponse, setSampleResponse] = useState(undefined as NetworkProgressPacket);
	const [libraryResponse, setLibraryResponse] = useState(undefined as NetworkProgressPacket);

	//state variable that will have any error passed to it
	const [errorMessage, setErrorMessage] = useState("");

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
		} else if (globalResponse?.statusMessage === "error") {
			doError(globalResponse.error);
		}
	}, [globalResponse]);

	async function doError(err: string) {
		setLoading(false);
		setErrorMessage(err);
		modalRef.current?.showModal();
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		//reset page state
		setGlobalResponse(undefined);
		setProjectResponse(undefined);
		setSampleResponse(undefined);
		setLibraryResponse(undefined);
		setErrorMessage("");

		//scroll into view
		document.getElementById("projectSubmitSection")!.scrollIntoView({
			block: "start",
			behavior: "smooth"
		});

		//get all files from event beforehand
		const projectFile = event.currentTarget.project.files[0] as File;
		const sampleFile = event.currentTarget.sample.files[0] as File;
		const libraryFile = event.currentTarget.library.files[0] as File;

		const imageFile = getImageFile(event.currentTarget);
		let imageInfo;
		if (imageFile) {
			if (!imageFile.type.startsWith("image")) {
				doError("Image file must have type image/*");
				return;
			}

			imageInfo = {
				image: getImageFromForm(event.currentTarget, newAttribution, currAttribution),
				attribution: newAttribution ? getAttributionFromForm(event.currentTarget) : undefined
			};
		}

		try {
			//upload files
			//project
			setProjectResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const projectFileUrl = (
				await upload(`submissions/${projectFile.name}`, projectFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload",
					multipart: projectFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setProjectResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

			//samples
			setSampleResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const sampleFileUrl = (
				await upload(`submissions/${sampleFile.name}`, sampleFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload",
					multipart: sampleFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setSampleResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

			//libraries
			setLibraryResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const libraryFileUrl = (
				await upload(`submissions/${libraryFile.name}`, libraryFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload",
					multipart: libraryFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setLibraryResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

			if (imageFile) {
				const imageUrl = (
					await upload(`submissions/${imageFile.name}`, imageFile, {
						access: "public",
						handleUploadUrl: "/api/file/upload"
					})
				).url;
				imageInfo!.image.url = imageUrl;
			}

			//trigger streamed action
			doProgressActionManyGlobal(
				projectSubmitAction,
				[setProjectResponse, setSampleResponse, setLibraryResponse],
				setGlobalResponse,
				projectFileUrl,
				sampleFileUrl,
				libraryFileUrl,
				userIds,
				imageInfo
			);
		} catch (err) {
			const error = err as Error;
			doError(error.message);
		}
	}

	return (
		<>
			<form
				className="grid grid-cols-12 gap-12 w-full"
				onSubmit={(e) => {
					if (e.currentTarget.imageFile.files.length) {
						setShowCoverImage(true);
					}
					handleSubmit(e);
				}}
			>
				{/* Left column: give more space to users */}
				<div className="col-span-6 space-y-6">
					<SubmitFormSection
						title="Add a cover image"
						info="This image will be displayed on the page for this project."
					>
						<div className="collapse collapse-arrow bg-base-100 border-base-300 border">
							<input
								type="checkbox"
								disabled={loading}
								checked={showCoverImage}
								onChange={(e) => setShowCoverImage(e.currentTarget.checked)}
							/>
							<div className="collapse-title">{showCoverImage ? "Hide" : "Show"}</div>
							<div className="collapse-content">
								<ImageSubmitForm
									newAttribution={newAttribution}
									setNewAttribution={setNewAttribution}
									currAttribution={currAttribution}
									setCurrAttribution={setCurrAttribution}
									loading={loading}
								/>
							</div>
						</div>
					</SubmitFormSection>

					<SubmitFormSection
						title="Add users to Project"
						info="Users added to this Project are able to submit new Analyses for it, edit it, and delete it."
					>
						<div className="flex flex-col w-3/4">
							<UserAdder userIds={userIds} setUserIds={setUserIds} disabled={loading} />
						</div>
					</SubmitFormSection>
				</div>

				{/* Right column: files + progress + submit */}
				<div id="projectSubmitSection" className="col-span-6 ml-8">
					<SubmitFormSection
						title="Upload files"
						className="space-y-6 w-full text-base-content/80 text-base font-normal"
					>
						<div className="space-y-2">
							<fieldset className="fieldset">
								<legend className="fieldset-legend text-sm text-base-content/80 font-normal">
									Project Metadata File:
								</legend>
								<input
									type="file"
									className="file-input file-input-primary"
									name="project"
									required
									disabled={loading}
									accept=".tsv"
								/>
							</fieldset>
							<ProgressBar loading={loading} data={projectResponse} />
						</div>

						<div className="space-y-2">
							<fieldset className="fieldset">
								<legend className="fieldset-legend text-sm text-base-content/80 font-normal">
									Sample Metadata File:
								</legend>
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
						</div>

						<div className="space-y-2">
							<fieldset className="fieldset">
								<legend className="fieldset-legend text-sm text-base-content/80 font-normal">
									Library (Experiment Run) Metadata File:
								</legend>
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
						</div>

						<div className="pt-2 space-y-4">
							<button className="btn btn-success" disabled={loading}>
								Submit
							</button>

							{loading ? (
								<div>
									<span className="loading loading-spinner loading-xl"></span>
								</div>
							) : (
								globalResponse?.statusMessage === "error" && (
									<div>
										<div className="tooltip tooltip-error" data-tip={globalResponse.error}>
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
					{errorMessage ? "Submission Failed" : "Project Submitted Successfully"}
				</h3>

				{globalResponse?.statusMessage === "success" ? (
					globalResponse!.progress!.message.split("__ASSAY_MASTER_LIST_URL__").map((str, i) => (
						<Fragment key={i}>
							{i !== 0 ? (
								//this is a naive solution
								<Link
									href={process.env.NEXT_PUBLIC_ASSAY_MASTER_LIST_URL as string}
									className="link link-primary link-hover"
								>
									Assay Master List
								</Link>
							) : (
								""
							)}
							<span className="mb-2 font-light whitespace-pre-wrap">{str}</span>
						</Fragment>
					))
				) : (
					<span className="mb-2 font-light whitespace-pre-wrap">{errorMessage}</span>
				)}
				{globalResponse?.statusMessage === "success" && (
					<div className="modal-action">
						<button type="submit" className="btn" onClick={() => router.push("/submit/analysis")}>
							Next
						</button>
					</div>
				)}
			</Modal>
		</>
	);
}
