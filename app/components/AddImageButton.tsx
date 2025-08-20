"use client";

import { FormEvent, useRef, useState } from "react";
import { Attribution } from "../generated/prismaImages/client";
import addImageAction from "../actions/addImage";
import { upload } from "@vercel/blob/client";

export default function AddImageButton({ attributions }: { attributions: Attribution[] }) {
	const modalRef = useRef<HTMLDialogElement>(null);
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

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setLoading(true);

		const formData = new FormData(event.currentTarget);
		if (!newAttribution && currAttribution) {
			formData.set("attributionTitle", currAttribution.attributionTitle);
		}

		const imageFile = formData.get("imageFile") as File;
		const url = (
			await upload(imageFile.name, imageFile, {
				access: "public",
				handleUploadUrl: "/api/file/upload",
				multipart: imageFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
			})
		).url;
		formData.set("url", url);

		try {
			const result = await addImageAction(formData, newAttribution);
			if (result.statusMessage === "success") {
				reset();
				modalRef.current?.close();
			} else if (result.statusMessage === "error") {
				await fetch(`/api/file/delete?url=${url}`, {
					method: "DELETE"
				});
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
				Add Carousel Image
			</button>

			<dialog ref={modalRef} className="modal">
				<div className="modal-box">
					<button
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={(e) => {
							e.preventDefault();
							modalRef.current?.close();
							reset();
						}}
						disabled={loading}
					>
						✕
					</button>

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
								<legend className="fieldset-legend">Attribution Institute</legend>
								<input
									name="attributionInstitute"
									type="text"
									className="input"
									placeholder="Attribution Institute"
									disabled={!newAttribution}
									defaultValue={
										currAttribution && !newAttribution && currAttribution.attributionInstitute
											? currAttribution.attributionInstitute
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
				</div>

				<form
					method="dialog"
					className="modal-backdrop"
					onSubmit={() => {
						reset();
					}}
				>
					<button disabled={loading}>close</button>
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
			</dialog>
		</>
	);
}
