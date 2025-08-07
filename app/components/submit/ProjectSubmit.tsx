"use client";

import { useAuth } from "@clerk/nextjs";
import Modal from "../Modal";
import UserAdder from "../UserAdder";
import { FormEvent, useEffect, useRef, useState } from "react";
import ProgressBar from "../ProgressBar";
import projectSubmitAction from "@/app/actions/project/projectSubmit";
import { NetworkProgressPacket } from "@/types/globals";
import { useRouter } from "next/navigation";
import SubmitFormSection from "./SubmitFormSection";
import { doProgressActionMany } from "@/app/helpers/progress";

export default function ProjectSubmit() {
	const { userId } = useAuth();
	const [userIds, setUserIds] = useState([userId] as string[]);

	const router = useRouter();
	const [loading, setLoading] = useState(false);

	//response state variables that will have information streamed to them
	const [globalResponse, setGlobalResponse] = useState(undefined as NetworkProgressPacket);
	const [projectResponse, setProjectResponse] = useState(undefined as NetworkProgressPacket);
	const [sampleResponse, setSampleResponse] = useState(undefined as NetworkProgressPacket);
	const [libraryResponse, setLibraryResponse] = useState(undefined as NetworkProgressPacket);

	//state variable that will have any error passed to it
	const [errorMessage, setErrorMessage] = useState("");

	//refs for popup modal
	const modalRef = useRef<HTMLDialogElement>(null);
	const modalXRef = useRef<HTMLButtonElement>(null);
	const modalClickOffRef = useRef<HTMLButtonElement>(null);

	//detect when there's an error
	useEffect(() => {
		if (projectResponse?.statusMessage === "error") {
			setLoading(false);
			setErrorMessage(projectResponse.error);
			modalRef.current?.showModal();
		}
	}, [projectResponse]);
	useEffect(() => {
		if (sampleResponse?.statusMessage === "error") {
			setLoading(false);
			setErrorMessage(sampleResponse.error);
			modalRef.current?.showModal();
		}
	}, [sampleResponse]);
	useEffect(() => {
		if (libraryResponse?.statusMessage === "error") {
			setLoading(false);
			setErrorMessage(libraryResponse.error);
			modalRef.current?.showModal();
		}
	}, [libraryResponse]);

	//detect when entire submission was successful
	useEffect(() => {
		if (globalResponse?.statusMessage === "success") {
			setLoading(false);
			modalXRef.current!.disabled = true;
			modalClickOffRef.current!.disabled = true;
			modalRef.current?.showModal();
			setTimeout(() => {
				router.push("/submit/analysis");
			}, 5000);
		} else if (globalResponse?.statusMessage === "error") {
			setLoading(false);
			setErrorMessage(globalResponse.error);
			modalRef.current?.showModal();
		}
	}, [globalResponse]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);

		//reset page state
		setGlobalResponse(undefined);
		setProjectResponse(undefined);
		setSampleResponse(undefined);
		setLibraryResponse(undefined);
		setErrorMessage("");

		const isPrivate = event.currentTarget.isPrivate.checked;

		//create csv-parse parsers from the File objects
		const projectFile = event.currentTarget.project.files[0] as File;
		const sampleFile = event.currentTarget.sample.files[0] as File;
		const libraryFile = event.currentTarget.library.files[0] as File;

		//trigger streamed action
		await doProgressActionMany(
			projectSubmitAction,
			[setProjectResponse, setSampleResponse, setLibraryResponse],
			setGlobalResponse,
			projectFile,
			sampleFile,
			libraryFile,
			userIds,
			isPrivate
		);
	}

	return (
		<>
			<form className="flex flex-col items-center gap-5" onSubmit={handleSubmit}>
				<SubmitFormSection
					title="Make submission private"
					info="Only users added to this Project will be able to see private submissions."
				>
					<fieldset className="fieldset bg-base-100">
						<label className="fieldset-label flex gap-2">
							<input name="isPrivate" type="checkbox" className="checkbox" />
							<p>Private submission</p>
						</label>
					</fieldset>
				</SubmitFormSection>

				<SubmitFormSection
					title="Add users to submission"
					info="Users added to this Project are able to submit new Analyses for it, edit it, and delete it."
				>
					<div className="flex flex-col items-center">
						<UserAdder userIds={userIds} setUserIds={setUserIds} />
					</div>
				</SubmitFormSection>

				<SubmitFormSection title="Upload files" className="grid grid-cols-3 items-end gap-4 w-full">
					<fieldset className="fieldset col-2">
						<legend className="fieldset-legend">Project Metadata File:</legend>
						<input
							type="file"
							className="file-input file-input-primary"
							name="project"
							required
							disabled={loading}
							accept=".tsv"
						/>
					</fieldset>
					<ProgressBar loading={loading} data={projectResponse} />

					<fieldset className="fieldset col-2">
						<legend className="fieldset-legend">Sample Metadata File:</legend>
						<input
							type="file"
							className="file-input file-input-primary"
							name="sample"
							required
							disabled={loading}
							accept=".tsv"
						/>
					</fieldset>
					<ProgressBar loading={loading} data={sampleResponse} />

					<fieldset className="fieldset col-2">
						<legend className="fieldset-legend">Library (Experiment Run) Metadata File:</legend>
						<input
							type="file"
							className="file-input file-input-primary"
							name="library"
							required
							disabled={loading}
							accept=".tsv"
						/>
					</fieldset>
					<ProgressBar loading={loading} data={libraryResponse} />

					<button className="btn btn-success col-2 justify-self-center" disabled={loading}>
						Submit
					</button>

					{loading ? (
						<div className="flex justify-center">
							<span className="loading loading-spinner loading-xl"></span>
						</div>
					) : (
						globalResponse?.statusMessage === "error" && (
							<div className="flex justify-center">
								<div className="tooltip tooltip-error" data-tip={globalResponse.error}>
									<span className="text-white text-xl w-8 aspect-square rounded-full flex items-center justify-center border-2 border-error bg-error/10">
										✕
									</span>
								</div>
							</div>
						)
					)}
				</SubmitFormSection>
			</form>

			<Modal ref={modalRef} xRef={modalXRef} clickOffRef={modalClickOffRef}>
				<h3 className={`text-lg font-bold mb-2 ${errorMessage ? "text-error" : "text-success"}`}>
					{errorMessage ? "Submission Failed" : "Project Submitted Successfully"}
				</h3>
				<p className="mb-2 font-light whitespace-pre-wrap">
					{errorMessage
						? errorMessage
						: "Project successfully submitted! You will be redirected to submit your analysis files in 5 seconds..."}
				</p>
				{globalResponse?.statusMessage === "success" && (
					<div className="mt-4 flex items-center justify-center gap-2">
						<span className="loading loading-spinner loading-sm"></span>
						<span className="text-base-content/80 text-sm">Redirecting...</span>
					</div>
				)}
			</Modal>
		</>
	);
}
