import { del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";

export async function DELETE(request: Request) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		return { statusMessage: "error", error: "Unauthorized" };
	}
	//TODO: verify this blob is uploaded by this user

	const { searchParams } = new URL(request.url);
	const urlToDelete = searchParams.get("url") as string;
	await del(urlToDelete);

	return new Response();
}
