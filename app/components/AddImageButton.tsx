"use client";

import { SubmitEvent, useRef, useState } from "react";
import { Attribution } from "../generated/prismaImages/client";
import addImageAction from "@/app/actions/image/addImage";
import { upload } from "@vercel/blob/client";
import Modal from "./Modal";
import { Project, Taxonomy } from "../generated/prisma/client";

export default function AddImageButton({
	attributions,
	title,
	homePage,
	target
}: {
	attributions: Attribution[];
	title: string;
	homePage?: true;
	target?: { table: "project"; value: Project["project_id"] } | { table: "taxonomy"; value: Taxonomy["taxonomy"] };
}) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const [newAttribution, setNewAttribution] = useState(false);
	const [currAttribution, setCurrAttribution] = useState(undefined as Attribution | undefined);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	function reset() {
		setNewAttribution(false);
		setCurrAttribution(undefined);
		setLoading(false);
		setError("");
		formRef.current?.reset();
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		setLoading(true);

		const formData = new FormData(event.currentTarget);
		if (!newAttribution && currAttribution) {
			formData.set("attributionTitle", currAttribution.attributionTitle);
		}

		const imageFile = formData.get("imageFile") as File;
		const url = (
			await upload(`${homePage ? "carousel" : "images"}/${imageFile.name}`, imageFile, {
				access: "public",
				handleUploadUrl: "/api/file/upload",
				multipart: imageFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
			})
		).url;
		formData.set("url", url);
		formData.delete("imageFile");

		if (homePage) {
			formData.set("homePage", "true");
		} else {
			formData.set("homePage", "false");
		}

		try {
			const result = await addImageAction(formData, newAttribution, target);
			if (result.statusMessage === "success") {
				reset();
				modalRef.current?.close();
			} else if (result.statusMessage === "error") {
				setError(result.error);
			}
		} catch (err) {
			const error = err as Error;
			setError(error.message);
		}

		setLoading(false);
	}

	return (
		<>
			<button type="submit" className="btn" onClick={() => modalRef.current?.showModal()}>
				{title}
			</button>

			<Modal
				ref={modalRef}
				xRef={modalXRef}
				clickOffRef={modalClickOffRef}
				onClose={reset}
				className="w-[85vw] max-w-3xl max-h-[75vh] overflow-y-auto my-8"
			>
				<form ref={formRef} onSubmit={handleSubmit}>
					<fieldset className="fieldset">
						<legend className="fieldset-legend">Image name</legend>
						<input name="name" type="text" className="input" placeholder="Image name" required />
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Image file</legend>
						<input name="imageFile" type="file" className="file-input" required accept="image/*" />
					</fieldset>

					<div className="border border-primary rounded-sm p-2 my-2">
						<div className="grid grid-cols-2 gap-5">
							<fieldset className="fieldset">
								<legend className="fieldset-legend">Attribution</legend>
								<select
									className="select"
									disabled={newAttribution}
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
								disabled={!newAttribution}
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
								disabled={!newAttribution}
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
								disabled={!newAttribution}
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
						<input type="text" className="input" placeholder="Description" name="description" />
						<p className="label">Optional</p>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Location</legend>
						<input type="text" className="input" placeholder="Location" name="location" />
						<p className="label">Optional</p>
					</fieldset>

					<fieldset className="fieldset">
						<legend className="fieldset-legend">Date taken</legend>
						<input type="date" className="input" placeholder="Date taken" name="dateTaken" />
						<p className="label">Optional</p>
					</fieldset>

					<button className="btn btn-primary">Submit</button>
				</form>

				{loading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black opacity-50">
						<span className="loading loading-spinner loading-xl"></span>
					</div>
				)}

				{error && (
					<div role="alert" className="alert alert-error w-[75vw] absolute bottom-0">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6 shrink-0 stroke-current cursor-pointer"
							fill="none"
							viewBox="0 0 24 24"
							onClick={() => setError("")}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{error}</span>
					</div>
				)}
			</Modal>
		</>
	);
}
