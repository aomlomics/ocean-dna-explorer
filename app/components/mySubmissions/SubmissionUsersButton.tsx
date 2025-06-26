"use client";

import { TargetAction } from "@/types/globals";
import { useRef, useState } from "react";
import UserAdder from "../UserAdder";

export default function SubmissionUsersButton({
	userIds,
	action,
	target
}: {
	userIds: string[];
	action: TargetAction;
	target: string;
}) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const [reset, setReset] = useState(false);

	function close() {
		modalRef.current?.close();
		setReset(!reset);
	}

	return (
		<>
			<button
				className="btn btn-sm bg-primary text-neutral-content hover:bg-info"
				onClick={() => modalRef.current?.showModal()}
			>
				Users
			</button>
			<dialog ref={modalRef} className="modal">
				<div className="modal-box overflow-y-visible">
					<button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={close}>
						✕
					</button>

					<UserAdder
						submittable
						userIds={userIds}
						submitAction={action}
						target={target}
						afterSubmit={close}
						reset={reset}
					/>
				</div>
				<form method="dialog" onSubmit={close} className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}
