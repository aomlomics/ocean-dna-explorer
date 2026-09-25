"use client";

import type { TargetAction, Writeable } from "@/types/globals";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import ProgressCircle from "@/app/components/submit/ProgressCircle";
import TableMetadata from "@/types/tableMetadata";
import Modal from "../Modal";
import type { ModelName } from "@/types/tableMetadata";

export default function SubmissionDeleteButton({
	action,
	disabled,
	table,
	target,
	associatedTable,
	associated
}: {
	action: TargetAction;
	disabled?: boolean;
	table: ModelName;
	target: Writeable<(typeof TableMetadata)[keyof typeof TableMetadata]["titleField"]>;
} & (
	| { associatedTable: ModelName; associated: Record<string, any>[] }
	| { associatedTable?: undefined; associated?: undefined }
)) {
	const confirmRef = useRef<HTMLDialogElement>(null);
	const errorRef = useRef<HTMLDialogElement>(null);

	const router = useRouter();

	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeleted, setIsDeleted] = useState(false);
	const [error, setErrror] = useState("");

	async function handleDelete() {
		setIsDeleting(true);

		const result = await action(...(typeof target === "string" ? [target] : target));
		if (result.statusMessage === "success") {
			setIsDeleted(true);
			setTimeout(() => {
				router.push("/mySubmissions");
			}, 2000);
		} else if (result.statusMessage === "error") {
			setErrror(result.error);
			errorRef.current?.showModal();
		}

		setIsDeleting(false);
	}

	return (
		<>
			<div className={`flex gap-3 items-center ${isDeleted ? "opacity-50" : ""}`}>
				{isDeleting && <ProgressCircle loading={isDeleting} />}

				<button
					onClick={async () =>
						associated && associated.length ? confirmRef.current?.showModal() : await handleDelete()
					}
					disabled={disabled || isDeleting || isDeleted}
					className="btn btn-error"
				>
					{isDeleting ? "Deleting..." : "Delete"}
				</button>
			</div>

			<Modal ref={confirmRef}>
				<h2 className="text-2xl font-bold text-error">Confirm Deletion</h2>
				<h3 className="text-2xl font-bold text-primary mb-2">
					{typeof target === "string" ? target : target.join(" / ")}
				</h3>
				<p className="mb-2 text-md text-base-content">Are you sure you want to delete the {table}?</p>

				{associated && associated.length && (
					<div className="mb-2">
						<p className="text-md text-base-content">
							This will also delete the following {TableMetadata[associatedTable].plural}:
						</p>

						<ul className="list-disc list-inside space-y-1 bg-base-100 p-3 rounded-lg">
							{associated.map((a) => (
								<li key={Object.values(a).join("/")} className="text-md text-base-content">
									{typeof TableMetadata[associatedTable].titleField === "string"
										? a[TableMetadata[associatedTable].titleField]
										: TableMetadata[associatedTable].titleField
												.filter((f) => a[f])
												.map((f) => a[f])
												.join(" / ")}
								</li>
							))}
						</ul>
					</div>
				)}

				<button
					onClick={async () => {
						confirmRef.current?.close();
						await handleDelete();
					}}
					className="btn bg-primary text-error-content hover:bg-error"
				>
					Delete
				</button>
			</Modal>

			<Modal ref={errorRef}>
				<h3 className="text-lg font-bold mb-2 text-error">Failed to delete {table}</h3>

				<span className="mb-2 font-light whitespace-pre-wrap">{error}</span>
			</Modal>
		</>
	);
}
