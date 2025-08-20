import { PrismaClient } from "../generated/prismaImages/client";

function getPrisma() {
	return new PrismaClient();
}

const globalForPrismaImages = global as unknown as {
	prismaImages: ReturnType<typeof getPrisma>;
};

const prismaImages = globalForPrismaImages.prismaImages || getPrisma();

if (process.env.NODE_ENV !== "production") {
	globalForPrismaImages.prismaImages = prismaImages;
}

export { prismaImages };
