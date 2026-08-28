"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/app/components/mySubmissions/DeleteConfirmationModal";
import deleteImageAction from "@/app/actions/image/deleteImage";

export default function ImageDeleteButton({ imageId, imageName }: { imageId: number; imageName: string }) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const confirm = async () => {
		setLoading(true);
		const res = await deleteImageAction(imageId);
		setLoading(false);
		setOpen(false);
		if (res.statusMessage === "success") {
			router.refresh();
		} else {
			alert(res.error || "Failed to delete image");
		}
	};

	return (
		<div className="relative">
			<button className="btn btn-error btn-sm" onClick={() => setOpen(true)} disabled={loading}>
				{loading ? "Deleting..." : "Delete"}
			</button>
			<DeleteConfirmModal
				isOpen={open}
				onClose={() => setOpen(false)}
				onConfirm={confirm}
				target={imageName}
				associatedAnalyses={[]}
				entityLabel="image"
			/>
		</div>
	);
}
