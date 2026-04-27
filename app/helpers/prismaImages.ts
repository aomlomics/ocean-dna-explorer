import { PrismaClient } from "../generated/prismaImages/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getPrisma() {
	return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.IMAGE_POSTGRES_PRISMA_URL }) });
}

const globalForPrismaImages = global as unknown as {
	prismaImages: ReturnType<typeof getPrisma>;
};

const prismaImages = globalForPrismaImages.prismaImages || getPrisma();

if (process.env.NODE_ENV !== "production") {
	globalForPrismaImages.prismaImages = prismaImages;
}

export { prismaImages };
