"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import { parse } from "csv-parse";

function numberToLetters(num: number) {
	let letters = "";
	while (num >= 0) {
		letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[num % 26] + letters;
		num = Math.floor(num / 26) - 1;
	}
	return letters;
}

export default function TsvDisplayButton({
	label,
	url,
	parserOptions
}: {
	label: string;
	url: string;
	parserOptions?: Record<string, any>;
}) {
	const modalRef = useRef<HTMLDialogElement>(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [headers, setHeaders] = useState([] as string[]);
	const [records, setRecords] = useState([] as Record<string, any>[]);

	async function parseFile() {
		setLoading(true);
		const fileResponse = await fetch(url);

		if (!fileResponse.ok) {
			setError(`File responded ${fileResponse.status}: ${fileResponse.statusText}.`);
			return;
		}

		const parser = parse(await fileResponse.text(), parserOptions);

		let tempHeaders = [] as string[];
		let tempRecords = [] as Record<string, any>[];
		for await (const record of parser) {
			if (!tempHeaders.length) {
				tempHeaders = Object.keys(record);
			}
			tempRecords.push(record);
		}

		setHeaders(tempHeaders);
		setRecords(tempRecords);

		setLoading(false);
	}

	return (
		<>
			<button
				className="btn btn-sm bg-primary text-neutral-content hover:bg-info"
				onClick={() => {
					modalRef.current?.showModal();
					if (!headers.length || !records.length) {
						parseFile();
					}
				}}
			>
				{label}
			</button>
			<Modal ref={modalRef} className="max-w-none w-auto">
				{loading ? (
					<div className="w-[85vw] h-[80vh]">
						<span className="loading loading-spinner loading-xl"></span>
					</div>
				) : error ? (
					<div className="w-[85vw] h-[80vh]">{error}</div>
				) : (
					<>
						<div className="flex justify-center">
							<div className="flex gap-5">
								<h1 className="text-3xl font-semibold text-primary">{label}</h1>
								<a href={url} download className="btn">
									Download
									<svg className="size-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
								</a>
							</div>
						</div>

						<div className="overflow-auto w-[85vw] h-[80vh]">
							<table className="table table-zebra table-pin-rows table-pin-cols">
								{/* head */}
								<thead>
									<tr>
										<th></th>
										{headers.map((_, i) => (
											<td key={i} className="text-center">
												{numberToLetters(i)}
											</td>
										))}
									</tr>
								</thead>
								<tbody>
									{parserOptions?.columns && (
										<tr>
											<th className="text-base-content/60">1</th>
											{headers.map((head) => (
												<td key={head} className="font-bold">
													{head}
												</td>
											))}
										</tr>
									)}
									{records.map((rec, i) => (
										<tr key={i}>
											<th className="text-base-content/60">{i + parserOptions?.columns ? 2 : 1}</th>
											{Object.values(rec).map((value, j) => (
												<td key={j}>{value}</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				)}
			</Modal>
		</>
	);
}
