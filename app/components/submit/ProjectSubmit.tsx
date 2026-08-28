"use client";

import { useAuth } from "@clerk/nextjs";
import Modal from "../Modal";
import UserAdder from "../UserAdder";
import { type SubmitEvent, Fragment, useRef, useState } from "react";
import ProgressBar from "../ProgressBar";
import projectSubmitAction from "@/app/actions/project/create/projectSubmit";
import type { NetworkProgressPacket } from "@/types/globals";
import { useRouter } from "next/navigation";
import SubmitFormSection from "./SubmitFormSection";
import { doProgressActionManyGlobal } from "@/app/helpers/progress";
import { upload } from "@vercel/blob/client";
import Link from "next/link";
import type { AttributionModel } from "@/app/generated/prismaImages/models/Attribution";
import type { AttributionOptionalDefaults, ImagePartial } from "@/prismaImages/generated/zod";

export default function ProjectSubmit({ attributions }: { attributions: AttributionModel[] }) {
	const { userId } = useAuth();
	const [userIds, setUserIds] = useState([userId] as string[]);

	const router = useRouter();
	const [loading, setLoading] = useState(false);

	//state variables for image submission
	const [newAttribution, setNewAttribution] = useState(false);
	const [currAttribution, setCurrAttribution] = useState(undefined as AttributionModel | undefined);
	const [showCoverImage, setShowCoverImage] = useState(false);

	//response state variables that will have information streamed to them
	const [globalResponse, setGlobalResponse] = useState(undefined as NetworkProgressPacket | undefined);
	const [projectResponse, setProjectResponse] = useState(undefined as NetworkProgressPacket | undefined);
	const [sampleResponse, setSampleResponse] = useState(undefined as NetworkProgressPacket | undefined);
	const [libraryResponse, setLibraryResponse] = useState(undefined as NetworkProgressPacket | undefined);

	//state variable that will have any error passed to it
	const [errorMessage, setErrorMessage] = useState("");

	//refs for popup modal
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	function doError(err: string) {
		setLoading(false);
		setErrorMessage(err);
		modalRef.current?.showModal();
	}

	function updateResponse(setter: (res: NetworkProgressPacket) => void, res: NetworkProgressPacket) {
		setter(res);

		if (res?.statusMessage === "error") {
			doError(res.error);
		}
	}

	function updateGlobalResponse(res: NetworkProgressPacket) {
		setGlobalResponse(res);

		if (res?.statusMessage === "success") {
			setLoading(false);
			modalXRef.current!.disabled = true;
			modalClickOffRef.current!.disabled = true;
			modalRef.current?.showModal();
		} else if (res?.statusMessage === "error") {
			doError(res.error);
		}
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
		const projectFile = (event.currentTarget.elements.namedItem("project") as HTMLInputElement).files!.item(0)!;
		const sampleFile = (event.currentTarget.elements.namedItem("sample") as HTMLInputElement).files!.item(0)!;
		const libraryFile = (event.currentTarget.elements.namedItem("library") as HTMLInputElement).files!.item(0)!;

		const imageFile = (event.currentTarget.elements.namedItem("image") as HTMLInputElement).files!.item(0);
		let imageInfo;
		if (imageFile) {
			if (!imageFile.type.startsWith("image")) {
				doError("Image file must have type image/*");
				return;
			}

			imageInfo = {
				image: {
					name: event.currentTarget.imageName.value,
					attributionTitle:
						!newAttribution && currAttribution
							? currAttribution.attributionTitle
							: event.currentTarget.attributionTitle.value,
					description: event.currentTarget.imageDescription.value,
					location: event.currentTarget.imageLocation.value,
					dateTaken: event.currentTarget.imageDateTaken.value
				} as ImagePartial,
				attribution: newAttribution
					? ({
							attributionTitle: event.currentTarget.attributionTitle.value,
							attributionUrl: event.currentTarget.attributionUrl.value,
							attributionInstitution: event.currentTarget.attributionInstitution.value
						} as AttributionOptionalDefaults)
					: undefined
			};
		}

		try {
			//upload files
			//project
			setProjectResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const projectFileUrl = (
				await upload(`submissions/${encodeURIComponent(projectFile.name)}`, projectFile, {
					access: "public",
					handleUploadUrl: "/api/internal/file/upload",
					multipart: projectFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setProjectResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

			//samples
			setSampleResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const sampleFileUrl = (
				await upload(`submissions/${encodeURIComponent(sampleFile.name)}`, sampleFile, {
					access: "public",
					handleUploadUrl: "/api/internal/file/upload",
					multipart: sampleFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setSampleResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

			//libraries
			setLibraryResponse({ statusMessage: "progress", progress: { message: "Uploading file", value: 0 } });
			const libraryFileUrl = (
				await upload(`submissions/${encodeURIComponent(libraryFile.name)}`, libraryFile, {
					access: "public",
					handleUploadUrl: "/api/internal/file/upload",
					multipart: libraryFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url;
			setLibraryResponse({ statusMessage: "progress", progress: { message: "File uploaded", value: 5 } });

			if (imageFile) {
				const imageUrl = (
					await upload(`submissions/${encodeURIComponent(imageFile.name)}`, imageFile, {
						access: "public",
						handleUploadUrl: "/api/internal/file/upload"
					})
				).url;
				imageInfo!.image.url = imageUrl;
			}

			//trigger streamed action
			doProgressActionManyGlobal(
				projectSubmitAction,
				[
					(res) => updateResponse(setProjectResponse, res),
					(res) => updateResponse(setSampleResponse, res),
					(res) => updateResponse(setLibraryResponse, res)
				],
				updateGlobalResponse,
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
					if (e.currentTarget.image.files.length) {
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
								<fieldset className="fieldset">
									<legend className="fieldset-legend">Image name</legend>
									<input name="imageName" type="text" className="input" placeholder="Image name" disabled={loading} />
								</fieldset>

								<fieldset className="fieldset">
									<legend className="fieldset-legend">Image file</legend>
									<input name="image" type="file" className="file-input" accept="image/*" disabled={loading} />
								</fieldset>

								<div className="border border-primary rounded-sm p-2 my-2">
									<div className="grid grid-cols-2 gap-5">
										<fieldset className="fieldset">
											<legend className="fieldset-legend">Attribution</legend>
											<select
												className="select"
												disabled={loading || newAttribution}
												value={currAttribution?.attributionTitle}
												onChange={(e) =>
													setCurrAttribution(attributions.find((attr) => attr.attributionTitle === e.target.value))
												}
											>
												<option value="">No attribution</option>
												{attributions.map((attr) => (
													<option key={attr.id}>{attr.attributionTitle}</option>
												))}
											</select>
											<span className="label">Optional</span>
										</fieldset>

										<label className="label">
											<input
												type="checkbox"
												className="toggle"
												disabled={loading}
												checked={newAttribution}
												onChange={(e) => setNewAttribution(e.target.checked)}
											/>
											New attribution
										</label>
									</div>

									<fieldset className="fieldset">
										<legend className="fieldset-legend">Attribution title</legend>
										<input
											name="attributionTitle"
											type="text"
											className="input"
											placeholder="Attribution title"
											disabled={loading || !newAttribution}
											required={!!currAttribution || newAttribution}
											defaultValue={currAttribution && !newAttribution ? currAttribution.attributionTitle : undefined}
										/>
									</fieldset>

									{/* TODO: add names inputs with add button */}

									<fieldset className="fieldset">
										<legend className="fieldset-legend">Attribution URL</legend>
										<input
											name="attributionUrl"
											type="text"
											className="input"
											placeholder="Attribution URL"
											disabled={loading || !newAttribution}
											defaultValue={
												currAttribution && !newAttribution && currAttribution.attributionUrl
													? currAttribution.attributionUrl
													: undefined
											}
										/>
										<p className="label">Optional</p>
									</fieldset>

									<fieldset className="fieldset">
										<legend className="fieldset-legend">Attribution Institution</legend>
										<input
											name="attributionInstitution"
											type="text"
											className="input"
											placeholder="Attribution Institution"
											disabled={loading || !newAttribution}
											defaultValue={
												currAttribution && !newAttribution && currAttribution.attributionInstitution
													? currAttribution.attributionInstitution
													: undefined
											}
										/>
										<p className="label">Optional</p>
									</fieldset>
								</div>

								<fieldset className="fieldset">
									<legend className="fieldset-legend">Description</legend>
									<input
										type="text"
										className="input"
										placeholder="Description"
										name="imageDescription"
										disabled={loading}
									/>
									<p className="label">Optional</p>
								</fieldset>

								<fieldset className="fieldset">
									<legend className="fieldset-legend">Location</legend>
									<input type="text" className="input" placeholder="Location" name="imageLocation" disabled={loading} />
									<p className="label">Optional</p>
								</fieldset>

								<fieldset className="fieldset">
									<legend className="fieldset-legend">Date taken</legend>
									<input
										type="date"
										className="input"
										placeholder="Date taken"
										name="imageDateTaken"
										disabled={loading}
									/>
									<p className="label">Optional</p>
								</fieldset>
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
					<>
						{globalResponse!.progress!.message.split("__ASSAY_MASTER_LIST_URL__").map((str, i) => (
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
						))}

						<div className="modal-action">
							<button type="submit" className="btn" onClick={() => router.push("/submit/analysis")}>
								Next
							</button>
						</div>
					</>
				) : (
					<span className="mb-2 font-light whitespace-pre-wrap">{errorMessage}</span>
				)}
			</Modal>
		</>
	);
}
