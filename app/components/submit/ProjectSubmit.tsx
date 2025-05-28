"use client";

import projectSubmitAction from "@/app/actions/project/projectSubmit";
import { useRouter } from "next/navigation";
import { FormEvent, useReducer, useRef, useState } from "react";
import ProgressCircle from "./ProgressCircle";
import InfoButton from "../InfoButton";

function reducer(state: Record<string, string>, updates: Record<string, string>) {
	if (updates.reset) {
		return {};
	} else {
		return { ...state, ...updates };
	}
}

export default function ProjectSubmit() {
	const router = useRouter();
	const [responseObj, setResponseObj] = useReducer(reducer, {} as Record<string, string>);
	const [errorObj, setErrorObj] = useReducer(reducer, {} as Record<string, string>);
	const [loading, setLoading] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [fileStates, setFileStates] = useState<Record<string, File | null>>({
		project: null,
		sample: null,
		library: null
	});

	// Modal (popup) state after project submission
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);
	const [modalMessage, setModalMessage] = useState("");
	const [isError, setIsError] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, files } = e.target;
		setFileStates((prev) => ({
			...prev,
			[name]: files?.[0] || null
		}));
	};

	const allFilesPresent = fileStates.project && fileStates.sample && fileStates.library;

	//TODO: allow users to click out of the Submission Failed popup window
	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitted) return;

		setResponseObj({ reset: "true" });
		setErrorObj({ reset: "true" });
		setLoading("");
		setSubmitted(true);

		const formData = new FormData(event.currentTarget);
		const files = ["project", "sample", "library"];

		try {
			// Process each file sequentially just for progress display (fake loading)
			for (const f of files) {
				setLoading(f);
				await new Promise((resolve) => setTimeout(resolve, 500));
				setResponseObj({ [f]: "File received" });
			}

			// All files processed, proceed with submission
			setLoading("submitting");
			const result = await projectSubmitAction(formData);

			if (result.statusMessage === "error") {
				setIsError(true);
				console.log(result.error);
				setModalMessage(result.error);
				modalRef.current?.showModal();
				setErrorObj({
					global: result.error,
					status: "❌ Submission Failed",
					submission: "Failed"
				});
				setSubmitted(false);
			} else if (result.statusMessage === "success") {
				const successMessage =
					"Project successfully submitted! You will be redirected to submit your analysis files in 5 seconds...";
				setIsError(false);
				setModalMessage(successMessage);
				modalRef.current?.showModal();
				modalXRef.current!.disabled = true;
				modalClickOffRef.current!.disabled = true;
				setResponseObj({
					project: "Success!",
					samples: "Success!",
					library: "Success!",
					submission: "Success!",
					status: "✅ Project Submission Successful"
				});

				setTimeout(() => {
					router.push("/submit/analysis");
				}, 5000);
			}
		} catch (error) {
			setIsError(true);
			setModalMessage("An error occurred during submission.");
			modalRef.current?.showModal();
			setErrorObj({
				global: "An error occurred during submission.",
				status: "❌ Submission Failed",
				submission: "Failed"
			});
			setSubmitted(false);
		}

		setLoading("");
	}

	return (
		<div className="p-6 bg-base-100 rounded-lg shadow-sm -mt-6">
			<div className="min-h-[400px] mx-auto">
				<form className="flex-1 space-y-8 flex flex-col items-center" onSubmit={handleSubmit}>
					<fieldset className="fieldset p-4 bg-base-100 w-[400px]">
						<label className="fieldset-label flex gap-2">
							<input name="isPrivate" type="checkbox" className="checkbox" />
							<p>Private submission</p>
							<InfoButton infoText="" />
						</label>
					</fieldset>

					<div className="w-[400px] !mt-0">
						<label className="form-control w-[400px]">
							<div className="label">
								<span className="label-text text-base-content">Project Metadata File:</span>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="file"
									name="project"
									required
									disabled={!!loading || submitted}
									accept=".tsv"
									onChange={handleFileChange}
									className="file-input file-input-bordered file-input-primary bg-base-100 w-full [&::file-selector-button]:text-white"
								/>
								<ProgressCircle
									hasFile={!!fileStates["project"]}
									response={responseObj["project"]}
									error={errorObj["project"]}
									loading={loading === "project"}
								/>
							</div>
						</label>
					</div>
					<div className="w-[400px]">
						<label className="form-control w-full">
							<div className="label">
								<span className="label-text text-base-content">Sample Metadata File:</span>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="file"
									name="sample"
									required
									disabled={!!loading || submitted}
									accept=".tsv"
									onChange={handleFileChange}
									className="file-input file-input-bordered file-input-primary bg-base-100 w-full [&::file-selector-button]:text-white"
								/>
								<ProgressCircle
									hasFile={!!fileStates["sample"]}
									response={responseObj["sample"]}
									error={errorObj["sample"]}
									loading={loading === "sample"}
								/>
							</div>
						</label>
					</div>
					<div className="w-[400px]">
						<label className="form-control w-full">
							<div className="label">
								<span className="label-text text-base-content">Library (Experiment Run) Metadata File:</span>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="file"
									name="library"
									required
									disabled={!!loading || submitted}
									accept=".tsv"
									onChange={handleFileChange}
									className="file-input file-input-bordered file-input-primary bg-base-100 w-full [&::file-selector-button]:text-white"
								/>
								<ProgressCircle
									hasFile={!!fileStates["library"]}
									response={responseObj["library"]}
									error={errorObj["library"]}
									loading={loading === "library"}
								/>
							</div>
						</label>
					</div>

					<button
						className="btn btn-primary text-white w-[200px]"
						disabled={!!loading || submitted || !allFilesPresent}
					>
						{loading || submitted ? <span className="loading loading-spinner loading-sm"></span> : "Submit"}
					</button>
				</form>

				<dialog ref={modalRef} className="modal">
					<div className="modal-box">
						<button
							ref={modalXRef}
							className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
							onClick={(e) => {
								e.preventDefault();
								modalRef.current?.close();
							}}
						>
							✕
						</button>
						<h3 className={`text-lg font-bold mb-2 ${isError ? "text-error" : "text-success"}`}>
							{isError ? "Submission Failed" : "Project Submitted Successfully"}
						</h3>
						<p className="mb-2 font-light whitespace-pre-wrap">{modalMessage}</p>
						{!isError && (
							<div className="mt-4 flex items-center justify-center gap-2">
								<span className="loading loading-spinner loading-sm"></span>
								<span className="text-base-content/80 text-sm">Redirecting...</span>
							</div>
						)}
					</div>
					<form method="dialog" className="modal-backdrop">
						<button ref={modalClickOffRef}>close</button>
					</form>
				</dialog>
			</div>
		</div>
	);
}
