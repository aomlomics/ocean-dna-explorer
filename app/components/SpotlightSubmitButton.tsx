"use client";

import { SubmitEvent, useRef, useState } from "react";
import Modal from "./Modal";
import ImageSubmitForm, { getAttributionFromForm, getImageFromForm } from "./ImageSubmitForm";
import { Attribution } from "../generated/prismaImages/client";
import { Project, Taxonomy } from "../generated/prisma/client";
import { upload } from "@vercel/blob/client";
import submitSpotlightAction from "../actions/taxonomySpotlight/submitSpotlight";
import { TaxonomySpotlightOptionalDefaults } from "@/prisma/generated/zod";

//TODO: allow selecting pre-existing spotlight
export default function SpotlightSubmitButton({
	taxonomy,
	availableProjects
}: {
	taxonomy: Taxonomy["taxonomy"];
	availableProjects: Project["project_id"][];
}) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const [newAttribution, setNewAttribution] = useState(false);
	const [currAttribution, setCurrAttribution] = useState(undefined as Attribution | undefined);

	function reset() {
		formRef.current?.reset();
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const imageFile = event.currentTarget.imageFile.files[0] as File;
		if (!imageFile.type.startsWith("imageFile")) {
			//TODO: handle error better
			throw new Error("Image file must have type image/*");
		}
		const imageUrl = (
			await upload(`submissions/${imageFile.name}`, imageFile, {
				access: "public",
				handleUploadUrl: "/api/file/upload"
			})
		).url;

		const spotlight = {
			imageFileUrl_ODE: imageUrl,
			description: event.currentTarget.description,
			project_id: event.currentTarget.project_id,
			taxonomy,
			commonName: event.currentTarget.commonName
		} as TaxonomySpotlightOptionalDefaults;

		const image = {
			...getImageFromForm(event.currentTarget, newAttribution, currAttribution),
			url: imageUrl
		};

		let attribution;
		if (newAttribution) {
			attribution = getAttributionFromForm(event.currentTarget);
		}

		await submitSpotlightAction(spotlight, image, attribution);
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
							{availableProjects.map((project_id) => (
								<option key={project_id}>{project_id}</option>
							))}
						</select>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Description</legend>
						<textarea name="description" className="textarea h-24" placeholder="Description" required></textarea>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Common name</legend>
						<input name="commonName" type="text" className="input" placeholder="Common name" />
						<p className="label">Optional</p>
					</fieldset>

					<ImageSubmitForm
						newAttribution={newAttribution}
						setNewAttribution={setNewAttribution}
						currAttribution={currAttribution}
						setCurrAttribution={setCurrAttribution}
						required
					/>

					<button className="btn btn-primary">Submit</button>
				</form>
			</Modal>
		</>
	);
}
