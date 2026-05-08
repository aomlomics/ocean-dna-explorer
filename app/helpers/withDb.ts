import { auth } from "@clerk/nextjs/server";
import { BlobFile, Prisma } from "../generated/prismaImages/client";
import { prismaImages } from "./prismaImages";

export async function validateBlobs(urls: BlobFile["url"][]) {
	console.log("urls:", urls);
	//skip check in development only, because onUploadCompleted does not trigger
	if (process.env.NODE_ENV === "development") {
		return true;
	}

	const { userId } = await auth();
	console.log(userId);
	if (!userId) {
		console.log("?????????");
		return false;
	}

	console.log("all:", await prismaImages.blobFile.findMany());
	for (const url of urls) {
		console.log(
			url,
			await prismaImages.blobFile.findUnique({
				where: {
					url,
					userId
				}
			})
		);
	}

	try {
		await prismaImages.$transaction(
			urls.map((url) =>
				prismaImages.blobFile.delete({
					where: {
						url,
						userId
					}
				})
			)
		);

		return true;
	} catch (err) {
		// return false only if a blobFile to delete was not found, otherwise raise the error
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
			return false;
		} else {
			throw err;
		}
	}
}
