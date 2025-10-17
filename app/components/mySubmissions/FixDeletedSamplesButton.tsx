"use client";

import { useRef, MouseEvent, useState } from "react";
import Modal from "../Modal";
import fixDeletedSamplesAction from "@/app/actions/project/delete/fixDeletedSamples";
import { useRouter } from "next/navigation";

export default function FixDeletedSamplesButton({ project_id }: { project_id: string }) {
	const router = useRouter();
	const modalRef = useRef<HTMLDialogElement>(null);
	const [errorMessage, setErrorMessage] = useState("");

	async function handleFix(event: MouseEvent<HTMLButtonElement>) {
		event.preventDefault();

		try {
			const result = await fixDeletedSamplesAction(project_id);

			if (result.statusMessage === "error") {
				setErrorMessage(result.error);
				modalRef.current?.showModal();
			} else {
				router.refresh();
			}
		} catch (err) {
			const error = err as Error;
			setErrorMessage(error.message);
			modalRef.current?.showModal();
		}
	}

	return (
		<>
			<button className="btn bg-error btn-sm" onClick={handleFix}>
				Fix
			</button>
			<Modal ref={modalRef}>{errorMessage}</Modal>
		</>
	);
}
