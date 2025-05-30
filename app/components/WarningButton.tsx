"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function WarningButton({
	value,
	buttonText,
	warningText,
	confirmText,
	action,
	redirectUrl,
	disabled
}: {
	value: string;
	buttonText: string;
	warningText: string;
	confirmText: string;
	action: (arg0: FormData) => Promise<void>;
	redirectUrl?: string;
	disabled?: boolean;
}) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const router = useRouter();
	const [confirm, setConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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
							setConfirm("");
							setError("");
						}}
						disabled={loading}
					>
						✕
					</button>
					<div className="flex flex-col gap-3">
						<h1 className="text-4xl text-warning">Warning</h1>
						<p className="mb-2 font-light whitespace-pre-wrap">{warningText}</p>
					</div>

					<form
						onSubmit={async (e) => {
							e.preventDefault();
							setLoading(true);
							try {
								await action(new FormData(e.currentTarget));
								modalRef.current?.close();
								setConfirm("");
								if (redirectUrl) {
									router.replace(redirectUrl);
								}
							} catch (err) {
								const error = err as Error;
								setError(error.message);
							}

							setLoading(false);
						}}
					>
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Enter "{confirmText}" below to confirm</legend>
							<input
								type="text"
								className="input"
								value={confirm}
								onChange={(e) => setConfirm(e.currentTarget.value)}
								disabled={loading}
							/>
						</fieldset>
						<input type="hidden" value={value} name="targetUserId" />
						<div className="modal-action">
							<button type="submit" className="btn btn-error" disabled={confirm !== confirmText || loading}>
								Confirm
							</button>
						</div>
					</form>
				</div>
				<form
					method="dialog"
					className="modal-backdrop"
					onSubmit={() => {
						setConfirm("");
						setError("");
					}}
				>
					<button disabled={loading}>close</button>
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
			</dialog>
		</>
	);
}
