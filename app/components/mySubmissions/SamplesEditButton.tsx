"use client";

import sampleEditAction from "@/app/actions/project/update/sampleEdit";
import { FormEvent, useEffect, useRef, useState } from "react";
import { NetworkProgressPacket } from "@/types/globals";
import ProgressBar from "../ProgressBar";
import { doProgressAction } from "@/app/helpers/progress";
import Modal from "../Modal";

export default function SubmissionUsersButton() {
	const modalRef = useRef<HTMLDialogElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState(undefined as NetworkProgressPacket);

	useEffect(() => {
		if (data?.statusMessage === "error") {
			setLoading(false);
			modalRef.current?.showModal();
		} else if (data?.statusMessage === "success") {
			close();
		}
	}, [data]);

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
		await doProgressAction({ action: sampleEditAction, setter: setData, args: [file] });
	}

	return (
		<>
			<button
				className="btn btn-sm bg-primary text-neutral-content hover:bg-info"
				onClick={() => modalRef.current?.showModal()}
			>
				Edit Samples
			</button>
			<Modal ref={modalRef}>
				<form ref={formRef} onSubmit={handleSubmit}>
					<fieldset className="fieldset">
						<legend className="fieldset-legend">Sample Metadata File:</legend>
						<input type="file" name="sampleMetadata" className="file-input" required accept=".tsv" />
					</fieldset>
					<button className="btn">Submit</button>
				</form>

				<ProgressBar loading={loading} data={data} />

				{data?.statusMessage === "error" && (
					<>
						<h3 className="text-lg font-bold mb-2 text-error">Edit Submission Failed</h3>
						<p className="mb-2 font-light whitespace-pre-wrap">{data.error}</p>
					</>
				)}
			</Modal>
		</>
	);
}
