"use client";

import testAction from "@/app/actions/sample/test";
import { StreamData } from "@/types/globals";
import { useState } from "react";

export default function TestStreaming() {
	const [data, setData] = useState({
		event: "message",
		data: { message: "", progress: 0 }
	} as StreamData);

	async function handleClick() {
		const readable = await testAction();
		const reader = readable.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			// Split the string into an array of individual JSON objects
			const stream = decoder.decode(value);
			console.log(stream);
			const jsonObjects = stream.trim().split("\n");

			// Now you can parse each JSON object
			jsonObjects.forEach((jsonStr) => {
				const data = JSON.parse(jsonStr) as StreamData;
				setData(data);
			});
		}
	}
	return (
		<>
			<button className="btn" onClick={handleClick}>
				Test
			</button>
			<progress className="progress progress-primary w-56" value={data.data.progress} max="100"></progress>
		</>
	);
}
