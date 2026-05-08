import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { NextResponse } from "next/server";
import { prismaImages } from "@/app/helpers/prismaImages";

export async function POST(request: Request) {
	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async (pathname, clientPayload) => {
				// Generate a client token for the browser to upload the file
				// ⚠️ Authenticate and authorize users before generating the token.
				// Otherwise, you're allowing anonymous uploads.
				const { userId, sessionClaims } = await auth();
				const role = sessionClaims?.metadata.role;

				if (!userId) {
					console.log("Blob upload unauthorized");
					throw new Error("Unauthorized");
				}
				if (!role || !RolePermissions[role].includes("contribute")) {
					console.log("Blob upload forbidden for", userId, "with role", role);
					throw new Error("Forbidden");
				}

				return {
					allowedContentTypes: ["text/tab-separated-values", "image/*"],
					addRandomSuffix: true,
					tokenPayload: JSON.stringify({
						userId
					})
				};
			},
			onUploadCompleted: async ({ blob, tokenPayload }) => {
				// Get notified of client upload completion
				// ⚠️ This will not work on `localhost` websites,
				// Use ngrok or similar to get the full upload flow

				if (!tokenPayload) {
					throw new Error("Missing token payload");
				}

				try {
					// Run any logic after the file upload completed
					const { userId } = JSON.parse(tokenPayload);
					const res = await prismaImages.blobFile.create({
						data: {
							url: blob.url,
							userId: userId as string
						}
					});
				} catch (error) {
					throw new Error("Error");
				}
			}
		});

		return NextResponse.json(jsonResponse);
	} catch (err) {
		const error = err as Error;
		return NextResponse.json(
			{ error: error.message }
			// The webhook will retry 5 times waiting for a 200
		);
	}
}
