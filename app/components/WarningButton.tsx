"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function WarningButton({
	value,
	buttonText,
	warningText,
	action,
	redirectUrl,
	disabled
}: {
	value: string;
	buttonText: string;
	warningText: string;
	action: (arg0: FormData) => Promise<void>;
	redirectUrl?: string;
	disabled?: boolean;
}) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const router = useRouter();
	const [confirm, setConfirm] = useState("");

	return (
		<>
			<button type="submit" className="btn btn-error" disabled={disabled} onClick={() => modalRef.current?.showModal()}>
				{buttonText}
			</button>

			<dialog ref={modalRef} className="modal">
				<div className="modal-box">
					<button
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={(e) => {
							e.preventDefault();
							modalRef.current?.close();
						}}
					>
						✕
					</button>
					<div className="flex flex-col gap-3">
						<h1 className="text-4xl text-warning">Warning</h1>
						<p className="mb-2 font-light whitespace-pre-wrap">{warningText}</p>

						<fieldset className="fieldset">
							<legend className="fieldset-legend">Enter "confirm" below</legend>
							<input
								type="text"
								className="input"
								value={confirm}
								onChange={(e) => setConfirm(e.currentTarget.value)}
							/>
						</fieldset>
					</div>
					<div className="modal-action">
						<form
							onSubmit={async (e) => {
								e.preventDefault();
								await action(new FormData(e.currentTarget));
								modalRef.current?.close();
								if (redirectUrl) {
									router.replace(redirectUrl);
								}
							}}
						>
							<input type="hidden" value={value} name="targetUserId" />
							<button type="submit" className="btn btn-error" disabled={confirm !== "confirm"}>
								Confirm
							</button>
						</form>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}
