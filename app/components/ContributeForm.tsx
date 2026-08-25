"use client";

import roleApplicationAction from "@/app/actions/roleApplication";
import { RolePermissions } from "@/types/objects";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { SubmitEvent, useRef, useState } from "react";

export default function ContributeForm() {
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState("");

	const { sessionClaims } = useAuth();
	const roleApplication = sessionClaims?.metadata.roleApplication;
	const role = sessionClaims?.metadata?.role;

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		modalRef.current?.showModal();

		const formData = new FormData(event.currentTarget);
		const response = await roleApplicationAction("contributor", (formData.get("description") as string) || undefined);
		if (response.statusMessage === "error") {
			setResult(response.error);
		} else if (response.statusMessage === "success") {
			setResult(response.result || "Application submitted successfully!");
		}

		modalClickOffRef.current!.disabled = false;
		modalXRef.current!.disabled = false;
		setLoading(false);
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="py-10 md:py-12 max-w-350 mx-auto flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8 lg:gap-12">
				<div className="w-full md:max-w-xl lg:max-w-2xl space-y-3 md:space-y-4">
					<h1 className="text-3xl md:text-3xl lg:text-4xl font-semibold text-primary">
						{role && RolePermissions[role].includes("contribute") ? (
							<span className="inline-flex items-center gap-2">
								<span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary p-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="w-6 h-6"
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
									</svg>
								</span>
								<span>You are an approved contributor</span>
							</span>
						) : (
							"Looking to contribute?"
						)}
					</h1>
					{!(role && RolePermissions[role].includes("contribute")) && (
						<p className="text-base md:text-lg text-base-content/80 leading-relaxed mb-4">
							Data submission requires approval from our team. Use the form below if you are interested in becoming a
							contributor!
						</p>
					)}
					{role && RolePermissions[role].includes("contribute") ? (
						<div className="space-y-4">
							<p className="text-base md:text-lg text-base-content/80 leading-relaxed">
								You already have permission to submit data. Thank you for being a part of the Ocean DNA Explorer!
							</p>
							<Link
								href="/mySubmissions"
								className="inline-flex items-center gap-2 rounded-lg bg-base-200 text-base-content hover:bg-base-300 px-4 py-2 text-sm md:text-base"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="w-5 h-5"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M4.5 5.25h9M4.5 9.75h9m-9 4.5h5.25M14.25 5.25H18a1.5 1.5 0 0 1 1.5 1.5v11.25a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 7.5 18V6.75a1.5 1.5 0 0 1 1.5-1.5h5.25Z"
									/>
								</svg>
								<span>View my submissions</span>
							</Link>
						</div>
					) : roleApplication || result ? (
						<div>
							Thanks for applying! We will get to your application as soon as possible and notify you when you have been
							accepted.
						</div>
					) : (
						<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
							<fieldset className="fieldset">
								<legend className="fieldset-legend text-base-content/80 text-base md:text-lg font-normal">
									Tell us about your data...
								</legend>
								<textarea name="description" className="textarea textarea-primary h-48 w-full"></textarea>
								<div className="label">Optional</div>
							</fieldset>
							<button className="btn btn-primary w-1/3 mx-auto">Submit</button>
						</form>
					)}
				</div>
			</div>

			<dialog ref={modalRef} className="modal">
				<div className="modal-box">
					<button
						ref={modalXRef}
						disabled
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={(e) => {
							e.preventDefault();
							modalRef.current?.close();
						}}
					>
						✕
					</button>
					{loading ? (
						<div className="w-full flex justify-center">
							<span className="loading loading-spinner loading-xl"></span>
						</div>
					) : (
						<div>{result}</div>
					)}
				</div>
				<form method="dialog" className="modal-backdrop">
					<button ref={modalClickOffRef} disabled>
						close
					</button>
				</form>
			</dialog>
		</div>
	);
}
