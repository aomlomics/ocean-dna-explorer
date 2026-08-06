"use client";

import { ChangeEvent, SubmitEvent, useRef, useState } from "react";
import WarningButton from "./WarningButton";
import { useAuth } from "@clerk/nextjs";
import { RolePermissions } from "@/types/objects";
import JSON5 from "json5";
import unsafeConsoleAction from "../actions/unsafeConsole";
import { TableNames } from "@/types/tableMetadata";

export default function PrismaConsole({ modelQueries }: { modelQueries: string[] }) {
	const [confirmed, setConfirmed] = useState(false);

	const [formatError, setFormatError] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const ref = useRef<HTMLAudioElement>(null);
	const [playing, setPlaying] = useState(false);

	const { userId, sessionClaims } = useAuth();
	const role = sessionClaims?.metadata?.role;

	if (!userId || !role || !RolePermissions[role].includes("manageDatabase")) {
		return <>Forbidden</>;
	}

	async function checkFormatting(e: ChangeEvent<HTMLTextAreaElement>) {
		try {
			JSON5.parse(e.target.value);
			setFormatError(false);
		} catch {
			setFormatError(true);
		}
	}

	async function format() {
		try {
			if (!textareaRef.current) {
				return;
			}

			const parsed = JSON5.parse(textareaRef.current.value);

			const quote = textareaRef.current.value.split("").find((char) => char === "'" || char === '"');
			textareaRef.current.value = JSON5.stringify(parsed, { space: "\t", quote });
		} catch {
			setFormatError(true);
		}
	}

	function allowTabs(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Tab") {
			e.preventDefault();

			const value = e.currentTarget.value;
			const selectionStart = e.currentTarget.selectionStart;
			const selectionEnd = e.currentTarget.selectionEnd;

			//add tab to value
			e.currentTarget.value = value.substring(0, selectionStart) + "\t" + value.substring(selectionEnd);

			//put cursor in correct location
			e.currentTarget.selectionStart = selectionEnd + 1 - (selectionEnd - selectionStart);
			e.currentTarget.selectionEnd = selectionEnd + 1 - (selectionEnd - selectionStart);
		}

		if (e.key === "Enter") {
			e.preventDefault();

			const value = e.currentTarget.value;
			const selectionStart = e.currentTarget.selectionStart;
			const selectionEnd = e.currentTarget.selectionEnd;

			//count number of tabs at the start of the current line
			const upToSelection = value.slice(0, selectionStart);
			const line = upToSelection.slice(upToSelection.lastIndexOf("\n") + 1);
			let tabNumber = 0;
			for (const char of line) {
				if (char === "\t") {
					tabNumber++;
				} else {
					break;
				}
			}

			//add newline and tabs to value
			e.currentTarget.value =
				value.substring(0, selectionStart) + "\n" + "\t".repeat(tabNumber) + value.substring(selectionEnd);

			//put cursor in correct location
			e.currentTarget.selectionStart = selectionEnd + 1 + tabNumber - (selectionEnd - selectionStart);
			e.currentTarget.selectionEnd = selectionEnd + 1 + tabNumber - (selectionEnd - selectionStart);
		}
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			const response = await unsafeConsoleAction(
				event.currentTarget.table.value,
				event.currentTarget.modelQuery.value,
				event.currentTarget.query.value
			);

			if (response.statusMessage === "error") {
				console.log(response.error);
			} else {
				console.log("success");
			}
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<div className="min-h-125 flex flex-col">
			{confirmed ? (
				<form className="flex flex-col gap-6 grow" onSubmit={handleSubmit}>
					<h1 className="text-4xl font-semibold text-primary">Prisma Console</h1>
					<div className="flex justify-center gap-5">
						<select className="select select-primary" defaultValue="" required name="table">
							<option value="" disabled>
								Select Table
							</option>
							{TableNames.map((table) => (
								<option key={table} value={table}>
									{table}
								</option>
							))}
						</select>

						<select className="select select-primary" defaultValue="" required name="modelQuery">
							<option value="" disabled>
								Select Model Query
							</option>
							{modelQueries
								.filter(
									(q) =>
										!q.startsWith("$") &&
										!q.startsWith("find") &&
										!q.startsWith("aggregate") &&
										!q.startsWith("count") &&
										q !== "groupBy" &&
										q !== "name" &&
										q !== "fields"
								)
								.sort()
								.map((q) => (
									<option key={q} value={q}>
										{q}
									</option>
								))}
						</select>
						<button className="btn btn-primary" type="button" onClick={format}>
							Format
						</button>
					</div>

					<textarea
						ref={textareaRef}
						className={`textarea w-full grow ${formatError ? "textarea-error" : "textarea-primary"}`}
						placeholder="Enter Prisma query..."
						name="query"
						required
						onKeyDown={allowTabs}
						onChange={checkFormatting}
						defaultValue={"{\n\t\n}"}
					/>

					<button className="btn btn-warning self-end">Run Query</button>
				</form>
			) : (
				<div className="bg-error rounded-lg p-6 flex flex-col gap-6 grow">
					<div className="text-6xl flex justify-around">
						<span>⚠️</span>
						<span>⚠️</span>
						<span
							onClick={async () => {
								if (playing) {
									setPlaying(false);
									if (ref.current) {
										ref.current.pause();
										ref.current.currentTime = 0;
									}
								} else {
									setPlaying(true);
									await ref.current?.play();
								}
							}}
						>
							⚠️
						</span>
						<audio
							onEnded={async () => {
								if (ref.current) {
									ref.current.currentTime = 0;
									await ref.current?.play();
								}
							}}
							ref={ref}
							src="/adminSound.mp3"
						/>
					</div>
					<h1 className="text-6xl text-warning text-center font-bold">WARNING</h1>
					<div className="text-3xl font-semibold text-warning grow text-center flex items-center px-20">
						Do not proceed unless you know what you are doing. This console will run raw queries directly on the live
						database.
					</div>
					<WarningButton
						buttonText="Click here to proceed"
						warningText="Proceed with caution. This will take you to the console connected to the live database."
						confirmText="I understand"
						action={() => setConfirmed(true)}
						className="btn-warning"
					/>
				</div>
			)}
		</div>
	);
}
