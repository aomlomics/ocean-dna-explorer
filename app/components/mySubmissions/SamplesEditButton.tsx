"use client";

import sampleEditAction from "@/app/actions/sample/sampleEdit";
import { FormEvent, useRef, useState } from "react";
import fromBlob from "from2-blob";
import { parse } from "csv-parse";

export default function SubmissionUsersButton() {
	const modalRef = useRef<HTMLDialogElement>(null);
	const [reset, setReset] = useState(false);

	function close() {
		modalRef.current?.close();
		setReset(!reset);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const file = event.currentTarget.sampleMetadata.files[0] as File;
		const result = await sampleEditAction(
			fromBlob(file).pipe(
				parse({
					columns: true,
					comment: "#",
					comment_no_infix: true,
					delimiter: "\t"
				})
			)
		);

		if (result.statusMessage === "success") {
			modalRef.current?.close();
		} else if (result.statusMessage === "error") {
			console.log(result.error);
		}
	}

	return (
		<>
			<button
				className="btn btn-sm bg-primary text-neutral-content hover:bg-info"
				onClick={() => modalRef.current?.showModal()}
			>
				Edit Samples
			</button>
			<dialog ref={modalRef} className="modal">
				<div className="modal-box overflow-y-visible">
					<button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={close}>
						✕
					</button>

					<form onSubmit={handleSubmit}>
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Sample Metadata File:</legend>
							<input type="file" name="sampleMetadata" className="file-input" required accept=".tsv" />
						</fieldset>
						<button className="btn">Submit</button>
					</form>
				</div>
				<form method="dialog" onSubmit={close} className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}
