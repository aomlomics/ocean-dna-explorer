import { auth } from "@clerk/nextjs/server";
import { BlobFile, Prisma } from "../generated/prismaImages/client";
import { prismaImages } from "./prismaImages";

export async function validateBlobs(urls: BlobFile["url"][]) {
	//skip check in development only, because onUploadCompleted does not trigger
	if (process.env.NODE_ENV === "development") {
		return true;
	}

	const { userId } = await auth();
	if (!userId) {
		return false;
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
