"use client";

import sampleEditAction from "@/app/actions/sample/sampleEdit";
import { FormEvent, useRef, useState } from "react";
import fromBlob from "from2-blob";
import { parse } from "csv-parse";
import { NetworkProgressPacket } from "@/types/globals";
import { doProgressAction } from "@/app/helpers/utils";
import ProgressBar from "../ProgressBar";

export default function SubmissionUsersButton() {
	const modalRef = useRef<HTMLDialogElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState(undefined as NetworkProgressPacket);

	function close() {
		modalRef.current?.close();
		formRef.current?.reset();
		setLoading(false);
		setData(undefined);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		const file = event.currentTarget.sampleMetadata.files[0] as File;
		await doProgressAction(
			() =>
				sampleEditAction(
					fromBlob(file).pipe(
						parse({
							columns: true,
							comment: "#",
							comment_no_infix: true,
							delimiter: "\t"
						})
					)
				),
			setData
		);

		close();
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

					<form ref={formRef} onSubmit={handleSubmit}>
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Sample Metadata File:</legend>
							<input type="file" name="sampleMetadata" className="file-input" required accept=".tsv" />
						</fieldset>
						<button className="btn">Submit</button>
					</form>

					<ProgressBar loading={loading} data={data} />
				</div>
				<form method="dialog" onSubmit={close} className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}
