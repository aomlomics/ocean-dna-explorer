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
		//retry finding blob files
		for (const url of urls) {
			let found = false;
			let attempts = 0;
			while (!found) {
				if (++attempts > 5) {
					console.log(url, "not found");
					return false;
				}

				found = !!(await prismaImages.blobFile.findUnique({
					where: {
						url
					}
				}));

				//retry after 1/10 of a second
				if (!found) {
					console.log("retrying", url);
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}
		}

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
