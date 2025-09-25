"use client";

import { Analysis } from "@/app/generated/prisma/client";
import { useRef, useState } from "react";
import Modal from "../Modal";

export default function AnalysisEditButton({
	analysis_run_name,
	isPrivate,
	isPrivateDisabled
}: {
	analysis_run_name: Analysis["analysis_run_name"];
	isPrivate: Analysis["isPrivate"];
	isPrivateDisabled: boolean;
}) {
	const modalRef = useRef<HTMLDialogElement>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		//check if data has been changed

		try {
			//TODO: display loading
			// const result = await action(submitFormData);
			// if (result.statusMessage === "success") {
			// 	console.log("success");
			// 	modalRef.current?.close();
			// } else {
			// 	//TODO: set error
			// 	console.log(result.error);
			// }
		} catch {
			//TODO: set error
			console.log("error");
		}
	}

	return (
		<>
			<button
				className="btn btn-sm bg-primary text-neutral-content hover:bg-info"
				onClick={() => modalRef.current?.showModal()}
			>
				Edit
			</button>
			<Modal ref={modalRef}>
				<form onSubmit={onSubmit} className="flex flex-col gap-3">
					<h2>Edit Analysis: {analysis_run_name}</h2>
					<fieldset className="fieldset">
						<legend className="fieldset-legend flex gap-2">
							<h2>isPrivate</h2>
						</legend>
						<input
							type="checkbox"
							className="checkbox checkbox-primary"
							defaultChecked={isPrivate}
							name="isPrivate"
							disabled={isPrivateDisabled}
						/>
					</fieldset>

					<button type="submit" className="btn">
						Submit
					</button>
				</form>
			</Modal>
		</>
	);
}
