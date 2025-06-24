"use client";

import roleApplicationAction from "@/app/actions/roleApplication";
import { Role } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { useAuth } from "@clerk/nextjs";
import { FormEvent, useRef, useState } from "react";

export default function Contribute() {
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState("");

	const { sessionClaims } = useAuth();
	const roleApplication = sessionClaims?.metadata.roleApplication;
	const role = sessionClaims?.metadata?.role as Role;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
		<main className="max-w-7xl mx-auto p-6">
			<div className="py-8 max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8 lg:gap-12">
				<div className="w-full md:max-w-xl lg:max-w-2xl">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-primary mb-4 md:mb-6">
						Looking to contribute?
					</h1>
					<p className="text-base md:text-lg text-base-content/80 leading-relaxed mb-4">
						Are you looking to contribute your data to Ocean DNA Explorer's growing collection? Sign up to be a
						Contributor now!
					</p>
					{role && RolePermissions[role].includes("contribute") ? (
						<div>You already have contribute permissions, thank you for being a part of Ocean DNA Explorer!</div>
					) : roleApplication || result ? (
						<div>
							Thanks for applying! We will get to your application as soon as possible and notify you when you have been
							accepted.
						</div>
					) : (
						<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
							<fieldset className="fieldset">
								<legend className="fieldset-legend">Tell us about your data</legend>
								<textarea name="description" className="textarea textarea-primary h-24 w-full"></textarea>
								<div className="label">Optional</div>
							</fieldset>
							<button className="btn btn-primary">Apply now</button>
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
		</main>
	);
}
