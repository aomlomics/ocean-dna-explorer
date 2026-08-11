"use client";

import { useRef, useState } from "react";
import Modal from "../Modal";
import { useRouter } from "next/navigation";
import deleteTagAction from "@/app/actions/tag/deleteTag";
import { Analysis, Tag } from "@/app/generated/prisma/client";
import AnalysisTag from "./AnalysisTag";
import Link from "next/link";
import { exploreAnalysisUrl } from "@/app/helpers/utils";

export default function DeleteTagButton({
	tag
}: {
	tag: Tag & { Analyses: { project_id: Analysis["project_id"]; analysis_run_name: Analysis["analysis_run_name"] }[] };
}) {
	const router = useRouter();

	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit() {
		modalXRef.current!.disabled = true;
		modalClickOffRef.current!.disabled = true;
		setLoading(true);

		try {
			const result = await deleteTagAction(tag.id);
			if (result.statusMessage === "success") {
				modalRef.current?.close();
				router.refresh();
			} else if (result.statusMessage === "error") {
				setError(result.error);
			}
		} catch (err) {
			const error = err as Error;
			setError(error.message);
		}

		modalXRef.current!.disabled = false;
		modalClickOffRef.current!.disabled = false;
		setLoading(false);
	}

	return (
		<>
			<button className="btn btn-sm btn-error" onClick={() => modalRef.current?.showModal()}>
				Delete
			</button>

			<Modal ref={modalRef} xRef={modalXRef} clickOffRef={modalClickOffRef}>
				<div className="text-center text-md text-base-content">
					<h3 className="text-2xl font-bold text-primary mb-2">Confirm Deletion</h3>
					<div className="mb-2 text-md text-base-content">
						Are you sure you want to delete the tag <AnalysisTag tag={tag} />?
					</div>
					{tag.Analyses.length > 0 && (
						<div className="mb-2">
							<p className="text-md text-base-content">
								The following Analys{tag.Analyses.length === 1 ? "i" : "e"}s will have this tag removed:
							</p>
							<ul className="list-disc list-inside space-y-1 bg-base-100 p-3 rounded-lg">
								{tag.Analyses.map((a) => (
									<li key={a.analysis_run_name}>
										<Link
											href={exploreAnalysisUrl(a.project_id, a.analysis_run_name)}
											className="link-primary link-hover"
										>
											{a.analysis_run_name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
					<div className="flex justify-center gap-3 mt-6">
						<button onClick={handleSubmit} className="btn bg-primary text-error-content hover:bg-error">
							Delete
						</button>
					</div>
				</div>

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
			</Modal>
		</>
	);
}
