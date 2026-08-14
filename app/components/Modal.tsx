"use client";

import { ReactNode, RefObject, useRef } from "react";

export default function Modal({
	children,
	ref,
	xRef,
	clickOffRef,
	className = "",
	onClose
}: {
	children?: ReactNode;
	ref: RefObject<HTMLDialogElement | null>;
	xRef?: RefObject<HTMLButtonElement | null>;
	clickOffRef?: RefObject<HTMLButtonElement | null>;
	className?: string;
	onClose?: () => void;
}) {
	const modalRef = useRef<HTMLDialogElement>(null);

	return (
		<dialog ref={ref || modalRef} className="modal">
			<div className={`modal-box [:where(&)]:m-10 ${className ?? ""}`}>
				<button
					ref={xRef}
					aria-label="Close dialog"
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
					onClick={(e) => {
						e.preventDefault();
						if (ref) {
							ref.current?.close();
						} else {
							modalRef.current?.close();
						}

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
					close
				</button>
			</form>
		</dialog>
	);
}
