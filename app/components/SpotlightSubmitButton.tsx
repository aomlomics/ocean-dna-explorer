"use client";

import { ReactNode, SubmitEvent, useRef, useState } from "react";
import Modal from "./Modal";
import ImageSubmitForm, { getAttributionFromForm, getImageFile, getImageFromForm } from "./ImageSubmitForm";
import { Attribution } from "../generated/prismaImages/client";
import { Project, Taxonomy, TaxonomySpotlight } from "../generated/prisma/client";
import { upload } from "@vercel/blob/client";
import submitSpotlightAction from "../actions/taxonomySpotlight/submitSpotlight";
import { TaxonomySpotlightOptionalDefaults } from "@/prisma/generated/zod";
import { ImageWithRelations } from "@/prismaImages/generated/zod";

//TODO: show current spotlight image
export default function SpotlightSubmitButton({
	taxonomy,
	spotlights,
	availableProjects
}: {
	taxonomy: Taxonomy["taxonomy"];
	spotlights: (TaxonomySpotlight & { Image: ImageWithRelations })[];
	availableProjects: Project["project_id"][];
}) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const [newSpotlight, setNewSpotlight] = useState(false);
	const [currSpotlight, setCurrSpotlight] = useState(undefined as (typeof spotlights)[number] | undefined);

	const [newAttribution, setNewAttribution] = useState(false);
	const [currAttribution, setCurrAttribution] = useState(undefined as Attribution | undefined);

	function reset() {
		setNewSpotlight(false);
		setCurrSpotlight(undefined);
		setNewAttribution(false);
		setCurrAttribution(undefined);
		formRef.current?.reset();
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const form = event.currentTarget;

		let spotlight = currSpotlight as TaxonomySpotlightOptionalDefaults;
		let image;
		if (newSpotlight) {
			const imageFile = getImageFile(form)!;
			console.log(imageFile.type);
			if (!imageFile.type.startsWith("image")) {
				//TODO: handle error better
				throw new Error("Image file must have type image/*");
			}
			const imageUrl = (
				await upload(`submissions/${imageFile.name}`, imageFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload"
				})
			).url;

			spotlight = {
				imageFileUrl_ODE: imageUrl,
				description: form.description.value,
				project_id: form.project_id.value,
				taxonomy,
				commonName: form.commonName.value
			};

			image = {
				...getImageFromForm(form, newAttribution, currAttribution),
				url: imageUrl
			};
		}

		const response = await submitSpotlightAction(spotlight, image, getAttributionFromForm(form, newAttribution));
		if (response.statusMessage === "success") {
			//TODO: show success
			modalRef.current?.close();
			reset();
		} else if (response.statusMessage === "error") {
			//TODO: show error
			throw new Error(response.error);
		}
	}

	return (
		<>
			<button type="submit" className="btn btn-primary" onClick={() => modalRef.current?.showModal()}>
				Submit Spotlight
			</button>

			<Modal
				ref={modalRef}
				xRef={modalXRef}
				clickOffRef={modalClickOffRef}
				className="w-[85vw] max-w-3xl max-h-[75vh] overflow-y-auto my-8"
				onClose={reset}
			>
				<form ref={formRef} onSubmit={handleSubmit}>
					<h1>Taxonomy Spotlight</h1>

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Project</legend>
						<select name="project_id" defaultValue="" className="select" required>
							<option value="" disabled>
								Select Project
							</option>
							{availableProjects.reduce((acc, project_id) => {
								//only show projects that don't have a spotlight for this taxonomy
								if (!spotlights.some((sl) => sl.project_id === project_id)) {
									acc.push(<option key={project_id}>{project_id}</option>);
								}

								return acc;
							}, [] as ReactNode[])}
						</select>
					</fieldset>

					<div className="grid grid-cols-2 gap-5">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Use Existing Spotlight</legend>
							<select
								className="select"
								disabled={newSpotlight}
								value={currSpotlight?.project_id}
								onChange={(e) => setCurrSpotlight(spotlights.find((sl) => sl.project_id === e.target.value))}
							>
								<option value="">Select Spotlight</option>
								{spotlights.map((sl) => (
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

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Description</legend>

						<textarea
							name="description"
							className={`textarea h-24${newSpotlight ? "" : " hidden"}`}
							placeholder="Description"
							disabled={!newSpotlight}
							required={newSpotlight}
						/>

						<textarea className={`textarea h-24${newSpotlight ? " hidden" : ""}`} placeholder="Description" disabled />
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

						<input type="text" className={`input${newSpotlight ? " hidden" : ""}`} placeholder="Common Name" disabled />

						<p className="label">Optional</p>
					</fieldset>

					<ImageSubmitForm
						newAttribution={newAttribution}
						setNewAttribution={setNewAttribution}
						currAttribution={currAttribution}
						setCurrAttribution={setCurrAttribution}
						required
						disabled={!newSpotlight}
					/>

					<button className="btn btn-primary" disabled={!newSpotlight && !currSpotlight}>
						Submit
					</button>
				</form>
			</Modal>
		</>
	);
}
