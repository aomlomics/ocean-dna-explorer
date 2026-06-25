"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Attribution, Image } from "../generated/prismaImages/client";
import { NetworkPacket } from "@/types/globals";

export default function ImageSubmitForm({
	newAttribution,
	setNewAttribution,
	currAttribution,
	setCurrAttribution,
	loading,
	required,
	disabled
}: {
	newAttribution: boolean;
	setNewAttribution: Dispatch<SetStateAction<boolean>>;
	currAttribution: Attribution | undefined;
	setCurrAttribution: Dispatch<SetStateAction<Attribution | undefined>>;
	loading?: boolean;
	required?: boolean;
	disabled?: boolean;
}) {
	const [attributions, setAttributions] = useState([] as Attribution[]);

	useEffect(() => {
		async function doFetch() {
			const res = await fetch("/api/attributions");
			if (res.ok) {
				const response = (await res.json()) as NetworkPacket;
				if (response.statusMessage === "success") {
					setAttributions(response.result);
				}
			}
		}

		doFetch();
	}, []);

	return (
		<>
			<fieldset className="fieldset">
				<legend className="fieldset-legend">Image File</legend>
				<input
					name="imageFile"
					type="file"
					className="file-input"
					accept="image/*"
					disabled={loading || disabled}
					required={required}
				/>
			</fieldset>

			<div className="border border-primary rounded-sm p-2 my-2">
				<div className="grid grid-cols-2 gap-5">
					<fieldset className="fieldset">
						<legend className="fieldset-legend">Attribution</legend>
						<select
							className="select"
							disabled={loading || newAttribution || disabled}
							value={currAttribution?.attributionTitle}
							onChange={(e) =>
								setCurrAttribution(attributions.find((attr) => attr.attributionTitle === e.target.value))
							}
						>
							<option value="">No Attribution</option>
							{attributions.map((attr) => (
								<option key={attr.id}>{attr.attributionTitle}</option>
							))}
						</select>
						<span className="label">Optional</span>
					</fieldset>

					<label className={`label select-none${loading || disabled ? " cursor-not-allowed" : ""}`}>
						<input
							type="checkbox"
							className="toggle"
							disabled={loading || disabled}
							checked={newAttribution}
							onChange={(e) => setNewAttribution(e.target.checked)}
						/>
						New Attribution
					</label>
				</div>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Attribution Title</legend>

					<input
						name="attributionTitle"
						type="text"
						className={`input${newAttribution ? "" : " hidden"}`}
						placeholder="Attribution Title"
						disabled={loading || !newAttribution || disabled}
						required={newAttribution}
					/>

					<input
						type="text"
						className={`input${newAttribution ? " hidden" : ""}`}
						placeholder="Attribution Title"
						disabled
						defaultValue={currAttribution?.attributionTitle || undefined}
					/>
				</fieldset>

				{/* TODO: add names inputs with add button */}

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Attribution URL</legend>

					<input
						name="attributionUrl"
						type="text"
						className={`input${newAttribution ? "" : " hidden"}`}
						placeholder="Attribution URL"
						disabled={loading || !newAttribution || disabled}
					/>

					<input
						type="text"
						className={`input${newAttribution ? " hidden" : ""}`}
						placeholder="Attribution URL"
						disabled
						defaultValue={currAttribution?.attributionUrl || undefined}
					/>

					<p className="label">Optional</p>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Attribution Institution</legend>

					<input
						name="attributionInstitution"
						type="text"
						className={`input${newAttribution ? "" : " hidden"}`}
						placeholder="Attribution Institution"
						disabled={loading || !newAttribution || disabled}
					/>

					<input
						type="text"
						className={`input${newAttribution ? " hidden" : ""}`}
						placeholder="Attribution Institution"
						disabled
						defaultValue={currAttribution?.attributionInstitution || undefined}
					/>

					<p className="label">Optional</p>
				</fieldset>
			</div>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">Image Name</legend>
				<input name="imageName" type="text" className="input" placeholder="Image name" disabled={loading || disabled} />
				<p className="label">Optional</p>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">Description</legend>
				<input
					type="text"
					className="input"
					placeholder="Description"
					name="imageDescription"
					disabled={loading || disabled}
				/>
				<p className="label">Optional</p>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">Location</legend>
				<input
					type="text"
					className="input"
					placeholder="Location"
					name="imageLocation"
					disabled={loading || disabled}
				/>
				<p className="label">Optional</p>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">Date Taken</legend>
				<input
					type="date"
					className="input"
					placeholder="Date taken"
					name="imageDateTaken"
					disabled={loading || disabled}
				/>
				<p className="label">Optional</p>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">License</legend>
				<input type="text" className="input" placeholder="License" name="imageLicense" disabled={loading || disabled} />
				<p className="label">Optional</p>
			</fieldset>
		</>
	);
}

export function getImageFile(form: HTMLFormElement) {
	return form.imageFile.files[0] as File | undefined;
}

export function getImageFromForm(
	form: HTMLFormElement,
	newAttribution: boolean,
	currAttribution: Attribution | undefined
) {
	return {
		attributionTitle: newAttribution ? form.attributionTitle.value : currAttribution?.attributionTitle,
		name: form.imageName.value,
		description: form.imageDescription.value || undefined,
		location: form.imageLocation.value || undefined,
		dateTaken: form.imageDateTaken.value || undefined,
		license: form.imageLicense.value || undefined
	} as Omit<Image, "id" | "dateSubmitted" | "url" | "userId" | "homePage"> & {
		url?: Image["url"];
		homePage?: Image["homePage"];
	};
}

export function getAttributionFromForm(form: HTMLFormElement, newAttribution: boolean) {
	if (newAttribution) {
		return {
			attributionTitle: form.attributionTitle.value,
			attributionUrl: form.attributionUrl.value || undefined,
			attributionInstitution: form.attributionInstitution.value || undefined
		} as Omit<Attribution, "id">;
	}
}
