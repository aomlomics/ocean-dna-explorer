import { NetworkProgressPacket, ProgressAction, ProgressActionMany, ProgressActionManyGlobal } from "@/types/globals";
import { Dispatch, SetStateAction, ActionDispatch } from "react";

export type Channel = { url: string; stream: ReturnType<typeof createProgressStream> };

export function createProgressStream() {
	const stream = new TransformStream();
	const writer = stream.writable.getWriter();
	const encoder = new TextEncoder();

	/**
	 * Send updates to client
	 * @param message - string message to display in toast
	 * @param value - number progress to display in button progress
	 */
	async function message(message: string, value: number) {
		const data = JSON.stringify({ statusMessage: "progress", progress: { message, value } });
		await writer.write(encoder.encode(`${data}\n`));
	}

	/**
	 * Send error to client
	 * @param message - string message to display in toast
	 */
	async function error(message: string) {
		const data = JSON.stringify({ statusMessage: "error", error: message });
		await writer.write(encoder.encode(`${data}\n`));
	}

	/**
	 * Send success to client
	 * @param message - string message to display in toast
	 */
	async function success(message: string) {
		const data = JSON.stringify({ statusMessage: "success", progress: { message, value: 100 } });
		await writer.write(encoder.encode(`${data}\n`));
	}

	/**
	 * Close the stream and terminate server process
	 */
	async function close() {
		await writer.close();
	}

	return {
		readable: stream.readable,
		message,
		error,
		success,
		close
	};
}

export async function doProgressAction({
	action,
	setter,
	reducer,
	args = []
}: {
	action: ProgressAction;
	setter?: Dispatch<SetStateAction<NetworkProgressPacket>>;
	reducer?: {
		id: string;
		key: string;
		setter: ActionDispatch<
			[
				update:
					| {
							id: string;
							key: string;
							res: NetworkProgressPacket;
					  }
					| undefined
			]
		>;
	};
	args: any[];
}) {
	const readable = await action(...args);
	const reader = readable.getReader();
	const decoder = new TextDecoder();

	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			return;
		}

		//split the string into an array of individual JSON objects
		const stream = decoder.decode(value);
		const jsonObjects = stream.trim().split("\n");

		//parse each JSON object
		for (const jsonStr of jsonObjects) {
			const data = JSON.parse(jsonStr) as NetworkProgressPacket;

			if (setter) {
				setter(data);
			} else if (reducer) {
				reducer.setter({ id: reducer.id, key: reducer.key, res: data });
			}

			if (data?.statusMessage === "error") {
				return data.error;
			}
		}
	}
}

async function handleReadable(readable: ReadableStream<any>, setter: (res: NetworkProgressPacket) => void) {
	const reader = readable.getReader();
	const decoder = new TextDecoder();

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		//split the string into an array of individual JSON objects
		const stream = decoder.decode(value);
		const jsonObjects = stream.trim().split("\n");

		//parse each JSON object
		jsonObjects.forEach((jsonStr) => {
			const data = JSON.parse(jsonStr) as NetworkProgressPacket;
			setter(data);
		});
	}
}

export async function doProgressActionMany(
	action: ProgressActionMany,
	setters: ((res: NetworkProgressPacket) => void)[],
	...args: any[]
) {
	const readables = await action(...args);

	for (let i = 0; i < readables.length; i++) {
		handleReadable(readables[i]!, setters[i]!);
	}
}

export async function doProgressActionManyGlobal(
	action: ProgressActionManyGlobal,
	setters: ((res: NetworkProgressPacket) => void)[],
	globalSetter: (res: NetworkProgressPacket) => void,
	...args: any[]
) {
	const { global, readables } = await action(...args);

	handleReadable(global, globalSetter);
	for (let i = 0; i < readables.length; i++) {
		handleReadable(readables[i]!, setters[i]!);
	}
}
