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
	required
}: {
	newAttribution: boolean;
	setNewAttribution: Dispatch<SetStateAction<boolean>>;
	currAttribution: Attribution | undefined;
	setCurrAttribution: Dispatch<SetStateAction<Attribution | undefined>>;
	loading?: boolean;
	required?: boolean;
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
				<legend className="fieldset-legend">Image Name</legend>
				<input
					name="imageName"
					type="text"
					className="input"
					placeholder="Image name"
					disabled={loading}
					required={required}
				/>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">Image File</legend>
				<input
					name="imageFile"
					type="file"
					className="file-input"
					accept="image/*"
					disabled={loading}
					required={required}
				/>
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
					<legend className="fieldset-legend">Attribution Title</legend>
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
				<input type="text" className="input" placeholder="Description" name="imageDescription" disabled={loading} />
				<p className="label">Optional</p>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">Location</legend>
				<input type="text" className="input" placeholder="Location" name="imageLocation" disabled={loading} />
				<p className="label">Optional</p>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">Date Taken</legend>
				<input type="date" className="input" placeholder="Date taken" name="imageDateTaken" disabled={loading} />
				<p className="label">Optional</p>
			</fieldset>

			<fieldset className="fieldset">
				<legend className="fieldset-legend">License</legend>
				<input type="text" className="input" placeholder="License" name="imageLicense" disabled={loading} />
				<p className="label">Optional</p>
			</fieldset>
		</>
	);
}

export function getImageFromForm(
	form: HTMLFormElement,
	newAttribution: boolean,
	currAttribution: Attribution | undefined
) {
	return {
		name: form.imageName,
		attributionTitle: newAttribution ? form.attributionTitle : currAttribution?.attributionTitle,
		description: form.imageDescription || undefined,
		location: form.imageLocation || undefined,
		dateTaken: form.imageDateTaken || undefined,
		license: form.imageLicense || undefined
	} as Omit<Image, "id" | "dateSubmitted" | "url" | "userId" | "homePage"> & {
		url?: Image["url"];
		homePage?: Image["homePage"];
	};
}

export function getAttributionFromForm(form: HTMLFormElement) {
	return {
		attributionTitle: form.attributionTitle,
		attributionUrl: form.attributionUrl || undefined,
		attributionInstitution: form.attributionInstitution || undefined
	} as Omit<Attribution, "id">;
}
