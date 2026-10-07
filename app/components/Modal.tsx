"use client";

import { type ReactNode, type RefObject } from "react";

export default function Modal({
	children,
	ref,
	xRef,
	clickOffRef,
	className = "",
	onClose
}: {
	children: ReactNode;
	ref: RefObject<HTMLDialogElement | null>;
	xRef?: RefObject<HTMLButtonElement | null>;
	clickOffRef?: RefObject<HTMLButtonElement | null>;
	className?: string;
	onClose?: () => void;
}) {
	return (
		<dialog ref={ref} className="modal">
			<div className={`modal-box [:where(&)]:m-10 ${className ?? ""}`}>
				<button
					ref={xRef}
					aria-label="Close dialog"
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
					onClick={(e) => {
						e.preventDefault();
						ref.current?.close();

						if (onClose) {
							onClose();
						}
					}}
				>
					✕
				</button>

				{children}
			</div>

			<form method="dialog" className="modal-backdrop">
				<button ref={clickOffRef} aria-label="Close dialog" onClick={onClose}>
					Close dialog
				</button>
			</form>
		</dialog>
	);
}
