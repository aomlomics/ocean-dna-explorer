"use server";

import { createProgressStream } from "@/app/helpers/utils";
import { ProgressStream } from "@/types/globals";

export default async function testAction() {
	const stream = createProgressStream();

	action(stream).then(() => stream.close());

	return stream.readable;
}

async function action(stream: ProgressStream) {
	await stream.message("Hello from the Server", 0);

	await new Promise((resolve) => setTimeout(resolve, 1000)); // fake api request
	await stream.message("Server Sent Event 1", 25);

	await new Promise((resolve) => setTimeout(resolve, 1000)); // fake api request
	await stream.message("Server Sent Event 2", 50);

	await new Promise((resolve) => setTimeout(resolve, 1000)); // fake api request
	await stream.message("Server Sent Event 3", 75);

	await new Promise((resolve) => setTimeout(resolve, 1000)); // fake api request
	await stream.success("Bye to the Client");
}
