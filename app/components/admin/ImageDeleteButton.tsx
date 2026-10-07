"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import deleteImageAction from "@/app/actions/image/deleteImage";
import Modal from "../Modal";

export default function ImageDeleteButton({ imageId, imageName }: { imageId: number; imageName: string }) {
	const router = useRouter();
	const ref = useRef<HTMLDialogElement>(null);

	const [loading, setLoading] = useState(false);

	async function handleDelete() {
		setLoading(true);

		const res = await deleteImageAction(imageId);
		if (res.statusMessage === "success") {
			router.refresh();
		} else {
			alert(res.error || "Failed to delete image");
		}

		setLoading(false);
	}

	return (
		<>
			<button className="btn btn-error btn-sm" onClick={() => ref.current?.showModal()} disabled={loading}>
				{loading ? "Deleting..." : "Delete"}
			</button>

			<Modal ref={ref}>
				<h2 className="text-2xl font-bold text-error">Confirm Deletion</h2>
				<h3 className="text-2xl font-bold text-primary mb-2">{imageName}</h3>
				<p className="mb-2 text-md text-base-content">Are you sure you want to delete the image?</p>

				<button
					onClick={async () => {
						ref.current?.close();
						await handleDelete();
					}}
					className="btn bg-primary text-error-content hover:bg-error"
				>
					Delete
				</button>
			</Modal>
		</>
	);
}
