"use client";

import { Action } from "@/types/globals";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProgressCircle from "@/app/components/submit/ProgressCircle";
import DeleteConfirmModal from "@/app/components/DeleteConfirmationModal";

const Toast = ({ message, type }: { message: string; type: "success" | "error" }) => {
	return (
		<div
			className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-lg shadow-sm 
			${type === "success" ? "bg-success text-success-content" : "bg-error text-error-content"}
			animate-fade-in-up text-lg
		`}
			style={{ zIndex: 9999 }}
		>
			<span className="font-medium">{message}</span>
		</div>
	);
};

export default function SubmissionDeleteButton({
	field,
	value,
	action,
	associatedAnalyses = []
}: {
	field: string;
	value: string;
	action: Action;
	associatedAnalyses?: { analysis_run_name: string }[];
}) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeleted, setIsDeleted] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
	const [showModal, setShowModal] = useState(false);
	const router = useRouter();

	const handleDelete = async () => {
		if (field === "project_id") {
			setShowModal(true);
			return;
		}
		executeDelete();
	};

	const executeDelete = async () => {
		setIsDeleting(true);
		setShowModal(false);

		try {
			const result = await action(value);
			if (result.statusMessage === "success") {
				setIsDeleted(true);
				setToast({ message: "Successfully deleted", type: "success" });
				setTimeout(() => {
					router.refresh();
				}, 4000);
			} else {
				setToast({ message: result.error || "Failed to delete", type: "error" });
			}
		} catch (error) {
			setToast({ message: "Failed to delete", type: "error" });
		}
		setIsDeleting(false);
		setTimeout(() => setToast(null), 4000);
	};

	return (
		<div className="relative">
			<div className={`flex gap-3 items-center ${isDeleted ? "opacity-50" : ""}`}>
				<button
					onClick={handleDelete}
					disabled={isDeleting || isDeleted}
					className="btn btn-sm bg-primary text-neutral-content hover:bg-error"
				>
					{isDeleting ? "Deleting..." : "Delete"}
				</button>
				{isDeleting && <ProgressCircle loading={isDeleting} response="" />}
			</div>
			{toast && <Toast message={toast.message} type={toast.type} />}
			<DeleteConfirmModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				onConfirm={executeDelete}
				projectId={value}
				associatedAnalyses={associatedAnalyses}
			/>
		</div>
	);
}
