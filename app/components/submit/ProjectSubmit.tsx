"use client";

import { useAuth } from "@clerk/nextjs";
import InfoButton from "../InfoButton";
import Modal from "../Modal";
import UserAdder from "../UserAdder";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import ProgressBar from "../ProgressBar";
import { doProgressActionMany, fileToStream } from "@/app/helpers/utils";
import projectSubmitAction from "@/app/actions/project/projectSubmit";
import { parse } from "csv-parse";
import { NetworkProgressPacket } from "@/types/globals";
import { useRouter } from "next/navigation";

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
			modalRef.current?.showModal();
			setErrorMessage(projectResponse.error);
		}
	}, [projectResponse]);
	useEffect(() => {
		if (sampleResponse?.statusMessage === "error") {
			setLoading(false);
			modalRef.current?.showModal();
			setErrorMessage(sampleResponse.error);
		}
	}, [sampleResponse]);
	useEffect(() => {
		if (libraryResponse?.statusMessage === "error") {
			setLoading(false);
			modalRef.current?.showModal();
			setErrorMessage(libraryResponse.error);
		}
	}, [libraryResponse]);

	//detect when entire submission was successful
	useEffect(() => {
		if (globalResponse?.statusMessage === "success") {
			setLoading(false);
			modalRef.current?.showModal();
			modalXRef.current!.disabled = true;
			modalClickOffRef.current!.disabled = true;
			setTimeout(() => {
				router.push("/submit/analysis");
			}, 5000);
		} else if (globalResponse?.statusMessage === "error") {
			setLoading(false);
			modalRef.current?.showModal();
			setErrorMessage(globalResponse.error);
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

		const projectParser = (await fileToStream(projectFile)).pipe(
			parse({
				columns: true,
				comment: "#",
				comment_no_infix: true,
				delimiter: "\t"
			})
		);
		const sampleParser = (await fileToStream(sampleFile)).pipe(
			parse({
				columns: true,
				comment: "#",
				comment_no_infix: true,
				delimiter: "\t"
			})
		);
		const libraryParser = (await fileToStream(libraryFile)).pipe(
			parse({
				columns: true,
				comment: "#",
				comment_no_infix: true,
				delimiter: "\t"
			})
		);

		//trigger streamed action
		await doProgressActionMany(
			projectSubmitAction,
			[projectParser, sampleParser, libraryParser],
			[projectParser.info, sampleParser.info, libraryParser.info],
			[setProjectResponse, setSampleResponse, setLibraryResponse],
			setGlobalResponse,
			[userIds, isPrivate]
		);
	}

	return (
		<div>
			<form className="flex flex-col items-center gap-5" onSubmit={handleSubmit}>
				<FormSection
					title="Make submission private"
					info="Only users added to this Project will be able to see private submissions."
				>
					<fieldset className="fieldset bg-base-100">
						<label className="fieldset-label flex gap-2">
							<input name="isPrivate" type="checkbox" className="checkbox" />
							<p>Private submission</p>
						</label>
					</fieldset>
				</FormSection>

				<FormSection
					title="Add users to submission"
					info="Users added to this Project are able to submit new Analyses for it, edit it, and delete it."
				>
					<div className="flex flex-col items-center">
						<UserAdder userIds={userIds} setUserIds={setUserIds} />
					</div>
				</FormSection>

				<FormSection title="Upload files" className="grid grid-cols-3 items-end gap-4 w-full">
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

					<button className="btn btn-primary col-2 justify-self-center" disabled={loading}>
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
				</FormSection>
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
		</div>
	);
}

function FormSection({
	children,
	title,
	info,
	className
}: {
	children?: ReactNode;
	title: string;
	info?: string;
	className?: string;
}) {
	return (
		<div className="flex flex-col items-center w-full">
			<div className="flex gap-2 justify-center w-full border-t-2 border-primary py-4">
				<div className="text-primary text-xl">{title}</div>
				{info && <InfoButton infoText={info} />}
			</div>

			<div className={className}>{children}</div>
		</div>
	);
}
