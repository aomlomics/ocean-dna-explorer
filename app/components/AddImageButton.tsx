"use client";

import { SubmitEvent, useRef, useState } from "react";
import { Attribution } from "../generated/prismaImages/client";
import addImageAction from "@/app/actions/image/addImage";
import { upload } from "@vercel/blob/client";
import Modal from "./Modal";
import { Project } from "../generated/prisma/client";
import ImageSubmitForm, { getAttributionFromForm, getImageFile, getImageFromForm } from "./ImageSubmitForm";

export default function AddImageButton({
	title,
	homePage,
	project_id
}: {
	title: string;
	homePage?: true;
	project_id?: Project["project_id"];
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

		const imageFile = getImageFile(event.currentTarget)!;
		if (!imageFile.type.startsWith("imageFile")) {
			setError("Image file must have type image/*");
		}
		const image = {
			...getImageFromForm(event.currentTarget, newAttribution, currAttribution),
			homePage,
			url: (
				await upload(`${homePage ? "carousel" : "images"}/${imageFile.name}`, imageFile, {
					access: "public",
					handleUploadUrl: "/api/file/upload",
					multipart: imageFile.size > 100 * 1000 * 1000 //only use multipart for files over 100 MB
				})
			).url
		};

		let attribution;
		if (newAttribution) {
			attribution = getAttributionFromForm(event.currentTarget);
		}

		try {
			const result = await addImageAction({ image, attribution, project_id });
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
					<ImageSubmitForm
						newAttribution={newAttribution}
						setNewAttribution={setNewAttribution}
						currAttribution={currAttribution}
						setCurrAttribution={setCurrAttribution}
						required
					/>

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
