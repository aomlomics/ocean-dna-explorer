import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { AppError, RolePermissions } from "@/types/objects";
import { NextResponse } from "next/server";
import { prismaImages } from "@/app/helpers/prismaImages";

export async function POST(request: Request) {
	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async () => {
				// Generate a client token for the browser to upload the file
				// ⚠️ Authenticate and authorize users before generating the token.
				// Otherwise, you're allowing anonymous uploads.
				const { userId, sessionClaims } = await auth();
				const role = sessionClaims?.metadata.role;

				if (!userId) {
					throw new AppError("Unauthorized", 401);
				}

				if (!role || !RolePermissions[role].includes("contribute")) {
					throw new AppError("Must have contributor role to upload files", 403);
				}

				return {
					allowedContentTypes: ["text/tab-separated-values", "image/*"],
					addRandomSuffix: true,
					maximumSizeInBytes: 10 * 1024 * 1024 * 1024, //10GB
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

				// Run any logic after the file upload completed
				const payload = JSON.parse(tokenPayload) as {
					userId?: string;
				};
				if (!payload.userId) {
					throw new Error("Missing user ID in token payload");
				}

				await prismaImages.blobFile.create({
					data: {
						url: blob.url,
						userId: payload.userId
					}
				});
			}
		});

		return NextResponse.json(jsonResponse);
	} catch (err) {
		console.error(err);

		if (err instanceof AppError) {
			return NextResponse.json({ error: err.message }, { status: err.statusCode });
		}

		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
