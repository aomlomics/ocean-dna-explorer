"use client";

import type { TargetAction } from "@/types/globals";
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
	const [resetKey, setResetKey] = useState(0);

	function close() {
		modalRef.current?.close();
		setResetKey((key) => key + 1);
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
						key={resetKey}
						submittable
						userIds={userIds}
						submitAction={action}
						target={target}
						afterSubmit={close}
					/>
				</div>
				<form method="dialog" onSubmit={close} className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}
