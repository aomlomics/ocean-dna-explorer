"use client";

import projectUploadAction from "@/app/helpers/actions/projectSubmit";
import { useRouter } from "next/navigation";
import { FormEvent, useReducer, useState } from "react";
import ProgressCircle from "./ProgressCircle";
import SubmissionStatusModal from "@/app/components/SubmissionStatusModal";

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
	const [showModal, setShowModal] = useState(false);
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

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitted) return;

		setResponseObj({ reset: "true" });
		setErrorObj({ reset: "true" });
		setLoading("");
		setSubmitted(true);

		const formData = new FormData(event.currentTarget);
		const fileTypes = ["project", "sample", "library"];

		try {
			// Process each file sequentially just for progress display
			for (const fileType of fileTypes) {
				setLoading(fileType);
				await new Promise((resolve) => setTimeout(resolve, 500));
				setResponseObj({ [fileType]: "File received" });
			}

			// All files processed, proceed with submission
			setLoading("submitting");
			const result = await projectUploadAction(formData);

			if (result.error) {
				setIsError(true);
				setModalMessage(result.error);
				setShowModal(true);
				setErrorObj({
					global: result.error,
					status: "❌ Submission Failed",
					submission: "Failed"
				});
				setSubmitted(false);
			} else if (result.message) {
				const successMessage =
					"Project successfully submitted! You will be redirected to submit your analysis files in 5 seconds...";
				setIsError(false);
				setModalMessage(successMessage);
				setShowModal(true);
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
			setShowModal(true);
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
		<div className="p-6 bg-base-100 rounded-lg shadow-xl -mt-6">
			<div className="min-h-[400px] mx-auto">
				<form className="flex-1 space-y-8 flex flex-col items-center" onSubmit={handleSubmit}>
					<div className="w-[400px]">
						<label className="form-control w-full">
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

				<SubmissionStatusModal isOpen={showModal} isError={isError} message={modalMessage} />
			</div>
		</div>
	);
}
