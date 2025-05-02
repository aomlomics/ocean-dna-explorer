import { del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ statusMessage: "error", error: "Unauthorized" });
	}

	const { searchParams } = new URL(request.url);
	const urlToDelete = searchParams.get("url") as string;
	await del(urlToDelete);

	return new Response();
}
