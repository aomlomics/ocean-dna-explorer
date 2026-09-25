"use client";

import { type SubmitEvent, useRef, useState } from "react";
import Modal from "../../Modal";
import ImageSubmitForm, { getAttributionFromForm, getImageFile, getImageFromForm } from "../../ImageSubmitForm";
import type { AttributionModel } from "../../../generated/prismaImages/models";
import type { ProjectModel, TaxonomyModel, TaxonomySpotlightModel } from "../../../generated/prisma/models";
import { upload } from "@vercel/blob/client";
import submitSpotlightAction from "../../../actions/taxonomySpotlight/submitSpotlight";
import type { TaxonomySpotlightPartial } from "@/prisma/generated/zod";
import type { ImageWithRelations } from "@/prismaImages/generated/zod";
import Link from "next/link";
import { getSubmissionFileName } from "@/app/helpers/utils";
import ProjectCoverPhotoPreview from "../../explore/ProjectCoverPhotoPreview";
import { useRouter } from "next/navigation";

//TODO: show current spotlight image
//TODO: show loading
export default function SpotlightSubmitForm({
	project_id,
	taxonomies,
	spotlightsWithImage
}: {
	project_id: ProjectModel["project_id"];
	taxonomies: TaxonomyModel["taxonomy"][];
	spotlightsWithImage: (TaxonomySpotlightModel & { Image: ImageWithRelations })[];
}) {
	const router = useRouter();

	const formRef = useRef<HTMLFormElement>(null);

	const errorRef = useRef<HTMLDialogElement>(null);
	const [errorMessage, setErrorMessage] = useState("");

	const [taxonomy, setTaxonomy] = useState("" as TaxonomyModel["taxonomy"]);

	const [newSpotlight, setNewSpotlight] = useState(!spotlightsWithImage.length);
	const [currSpotlight, setCurrSpotlight] = useState(undefined as (typeof spotlightsWithImage)[number] | undefined);

	const [newAttribution, setNewAttribution] = useState(false);
	const [currAttribution, setCurrAttribution] = useState(undefined as AttributionModel | undefined);

	function reset() {
		setTaxonomy("");
		setNewSpotlight(false);
		setCurrSpotlight(undefined);
		setNewAttribution(false);
		setCurrAttribution(undefined);
		formRef.current?.reset();
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const form = event.currentTarget;

		let spotlight = { ...currSpotlight } as
			(TaxonomySpotlightPartial & { Image?: NonNullable<typeof currSpotlight>["Image"] }) | undefined;
		let image;
		if (newSpotlight) {
			//new spotlight
			const imageFile = getImageFile(form)!;
			if (!imageFile.type.startsWith("image")) {
				setErrorMessage("Image file must have type image/*");
				errorRef.current?.showModal();
			}
			const imageUrl = (
				await upload(`submissions/${imageFile.name}`, imageFile, {
					access: "public",
					handleUploadUrl: "/api/internal/file/upload"
				})
			).url;

			spotlight = {
				project_id,
				imageFileUrl_ODE: imageUrl,
				description: form.description.value,
				commonName: form.commonName.value,
				taxonomy
			};

			image = {
				...getImageFromForm(form, newAttribution, currAttribution),
				url: imageUrl
			};
		} else if (spotlight) {
			delete spotlight.id;
			//existing image should not be sent to server action
			delete spotlight.Image;
		}

		const response = await submitSpotlightAction(
			project_id,
			spotlight as TaxonomySpotlightPartial,
			image,
			getAttributionFromForm(form, newAttribution)
		);
		if (response.statusMessage === "success") {
			//TODO: show success
			reset();
			router.refresh();
		} else if (response.statusMessage === "error") {
			setErrorMessage(response.error);
			errorRef.current?.showModal();
		}
	}

	const filteredExistingSpotlights = spotlightsWithImage.filter((sl) => sl.taxonomy === taxonomy);

	return (
		<>
			<form ref={formRef} onSubmit={handleSubmit}>
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomy</legend>
					<select
						className="select"
						required
						value={taxonomy}
						onChange={(e) => {
							setTaxonomy(e.currentTarget.value);
							setCurrSpotlight(undefined);
						}}
					>
						<option value="" disabled>
							Select Taxonomy
						</option>
						{taxonomies.map((t) => (
							<option key={t}>{t}</option>
						))}
					</select>
				</fieldset>

				{filteredExistingSpotlights.length ? (
					<div className="grid grid-cols-2 gap-5">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">
								{currSpotlight?.Image && !newSpotlight ? (
									<div className="flex gap-5">
										<div className="flex flex-col">
											Use Existing Spotlight:
											<Link href={currSpotlight?.Image.url} className="link link-primary link-hover">
												{getSubmissionFileName(currSpotlight?.Image.url)}
											</Link>
										</div>
										<ProjectCoverPhotoPreview src={currSpotlight?.Image.url} title={project_id} />
									</div>
								) : (
									<>Use Existing Spotlight:</>
								)}
							</legend>

							<select
								className="select"
								disabled={newSpotlight}
								value={currSpotlight?.project_id}
								onChange={(e) => setCurrSpotlight(spotlightsWithImage.find((sl) => sl.project_id === e.target.value))}
							>
								<option value="">Select Spotlight</option>
								{filteredExistingSpotlights.map((sl) => (
									<option key={sl.id}>{sl.project_id}</option>
								))}
							</select>
						</fieldset>

						<div className="grid grid-rows-[auto_1fr]">
							<span className="select-none">{"\u200b"}</span>
							<label className="label select-none">
								<input
									type="checkbox"
									className="toggle"
									checked={newSpotlight}
									onChange={(e) => setNewSpotlight(e.target.checked)}
								/>
								New spotlight
							</label>
						</div>
					</div>
				) : (
					<></>
				)}

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Description</legend>

					<textarea
						name="description"
						className={`textarea h-24${newSpotlight ? "" : " hidden"}`}
						placeholder="Description"
						disabled={!newSpotlight}
						required={newSpotlight}
					/>

					<textarea
						className={`textarea h-24${newSpotlight ? " hidden" : ""}`}
						placeholder="Description"
						disabled
						defaultValue={currSpotlight?.description}
					/>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Common Name</legend>

					<input
						name="commonName"
						type="text"
						className={`input${newSpotlight ? "" : " hidden"}`}
						placeholder="Common Name"
						disabled={!newSpotlight}
					/>

					<input
						type="text"
						className={`input${newSpotlight ? " hidden" : ""}`}
						placeholder="Common Name"
						disabled
						defaultValue={currSpotlight?.commonName || ""}
					/>

					<p className="label">Optional</p>
				</fieldset>

				<ImageSubmitForm
					newAttribution={newAttribution}
					setNewAttribution={setNewAttribution}
					currAttribution={currAttribution}
					setCurrAttribution={setCurrAttribution}
					required={newSpotlight}
					disabled={!newSpotlight}
				/>

				<button className="btn btn-primary" disabled={!newSpotlight && !currSpotlight}>
					Submit
				</button>
			</form>

			<Modal ref={errorRef}>
				<h3 className="text-lg font-bold mb-2 text-error">Spotlight Submission Failed</h3>
				<span className="mb-2 font-light whitespace-pre-wrap">{errorMessage}</span>
			</Modal>
		</>
	);
}
