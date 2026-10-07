"use client";

import Image from "next/image";
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
			<div className="modal-box w-auto max-w-none bg-transparent p-0 shadow-none transition-none" onClick={closeModal}>
				<form method="dialog">
					<button
						type="submit"
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
						aria-label="Close image preview"
					>
						✕
					</button>
				</form>
				<Image
					src={src}
					alt={alt}
					width={1920}
					height={1080}
					unoptimized //solves unknown hostname ESlint issue for image
					className="h-auto max-h-[90vh] w-auto max-w-[95vw] cursor-zoom-out object-contain"
				/>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button aria-label="Close image preview">close</button>
			</form>
		</dialog>
	);
}
