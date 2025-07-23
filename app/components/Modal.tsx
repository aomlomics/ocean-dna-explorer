"use client";

import { ReactNode, RefObject, useRef } from "react";

export default function Modal({
	children,
	ref,
	xRef,
	clickOffRef
}: {
	children?: ReactNode;
	ref?: RefObject<HTMLDialogElement | null>;
	xRef?: RefObject<HTMLButtonElement | null>;
	clickOffRef?: RefObject<HTMLButtonElement | null>;
}) {
	const modalRef = useRef<HTMLDialogElement>(null);

	return (
		<dialog ref={ref || modalRef} className="modal">
			<div className="modal-box">
				<button
					ref={xRef}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
					onClick={(e) => {
						e.preventDefault();
						if (ref) {
							ref.current?.close();
						} else {
							modalRef.current?.close();
						}
					}}
				>
					✕
				</button>

				{children}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button ref={clickOffRef}>close</button>
			</form>
		</dialog>
	);
}
