"use client";

import { SubmitEvent, useRef, useState } from "react";
import Modal from "../Modal";
import AnalysisTag from "./AnalysisTag";
import addTagAction from "../../actions/tag/addTag";
import { useRouter } from "next/navigation";

export default function AddTagButton() {
	const router = useRouter();

	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	const [tagName, setTagName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState("#233D7F"); //default to secondary color

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	function reset() {
		setTagName("");
		setDescription("");
		setColor("#233D7F");
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		modalXRef.current!.disabled = true;
		modalClickOffRef.current!.disabled = true;
		setLoading(true);

		try {
			const result = await addTagAction({ tagName, description, color });
			if (result.statusMessage === "success") {
				modalRef.current?.close();
				reset();
				router.refresh();
			} else if (result.statusMessage === "error") {
				setError(result.error);
			}
		} catch (err) {
			const error = err as Error;
			setError(error.message);
		}

		modalXRef.current!.disabled = false;
		modalClickOffRef.current!.disabled = false;
		setLoading(false);
	}

	return (
		<>
			<button className="btn" onClick={() => modalRef.current?.showModal()}>
				Add Analysis Tag
			</button>

			<Modal ref={modalRef} xRef={modalXRef} clickOffRef={modalClickOffRef} onClose={reset}>
				<div className="flex flex-col items-start gap-2">
					<h1>Add new analysis tag</h1>

					<div className="flex gap-2">
						<h2>Preview:</h2>
						<AnalysisTag tag={{ tagName, description, color }} />
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col w-full">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Tag name</legend>
							<input
								className="input input-primary"
								value={tagName}
								onChange={(e) => setTagName(e.target.value)}
								placeholder="Tag name"
								required
							/>
						</fieldset>

						<fieldset className="fieldset">
							<legend className="fieldset-legend">Description</legend>
							<input
								className="input input-primary"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Description"
								required
							/>
						</fieldset>

						<fieldset className="fieldset">
							<legend className="fieldset-legend">Color</legend>
							<div className="flex items-center">
								<label htmlFor="tagColorPicker" className="cursor-pointer pr-2 h-full flex items-center">
									<svg
										height="20px"
										width="20px"
										version="1.1"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 32 32"
										className="text-primary"
										stroke="currentColor"
										fill="currentColor"
									>
										<path
											d="M27.7,3.3c-1.5-1.5-3.9-1.5-5.4,0L17,8.6l-1.3-1.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l1.3,1.3L5,20.6
	c-0.6,0.6-1,1.4-1.1,2.3C3.3,23.4,3,24.2,3,25c0,1.7,1.3,3,3,3c0.8,0,1.6-0.3,2.2-0.9C9,27,9.8,26.6,10.4,26L21,15.4l1.3,1.3
	c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L22.4,14l5.3-5.3C29.2,7.2,29.2,4.8,27.7,3.3z M9,24.6
	c-0.4,0.4-0.8,0.6-1.3,0.5c-0.4,0-0.7,0.2-0.9,0.5C6.7,25.8,6.3,26,6,26c-0.6,0-1-0.4-1-1c0-0.3,0.2-0.7,0.5-0.8
	c0.3-0.2,0.5-0.5,0.5-0.9c0-0.5,0.2-1,0.5-1.3L17,11.4l2.6,2.6L9,24.6z"
										/>
									</svg>
								</label>
								<input
									className="cursor-pointer"
									id="tagColorPicker"
									type="color"
									value={color}
									onChange={(e) => setColor(e.target.value)}
								/>
							</div>
						</fieldset>

						<button className="btn btn-primary self-end">Submit</button>
					</form>
				</div>

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
