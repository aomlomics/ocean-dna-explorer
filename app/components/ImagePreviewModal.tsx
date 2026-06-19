"use client";

import { useEffect, useRef } from "react";

type ImagePreviewModalProps = {
	isOpen: boolean;
	onClose: () => void;
	src: string;
	alt: string;
};

export default function ImagePreviewModal({ isOpen, onClose, src, alt }: ImagePreviewModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	function closeModal() {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (dialog.open) dialog.close();
	}

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen) {
			if (!dialog.open) dialog.showModal();
			return;
		}
		if (dialog.open) dialog.close();
	}, [isOpen]);

	return (
		<dialog ref={dialogRef} className="modal transition-none backdrop:bg-black/80" onClose={onClose}>
			<div
				className="modal-box w-auto max-w-none bg-transparent p-0 shadow-none transition-none"
				onClick={closeModal}
			>
				<form method="dialog">
					<button
						type="submit"
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
						aria-label="Close image preview"
					>
						✕
					</button>
				</form>
				<img src={src} alt={alt} className="max-h-[90vh] max-w-[95vw] cursor-zoom-out object-contain" />
			</div>
			<form method="dialog" className="modal-backdrop">
				<button aria-label="Close image preview">close</button>
			</form>
		</dialog>
	);
}
