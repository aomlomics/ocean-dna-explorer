import { PrismaClient } from "../generated/prismaImages/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrismaImages = global as unknown as {
	prismaImages: PrismaClient;
};

const prismaImages =
	globalForPrismaImages.prismaImages ||
	new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.IMAGE_POSTGRES_PRISMA_URL }) });

if (process.env.NODE_ENV !== "production") {
	globalForPrismaImages.prismaImages = prismaImages;
}

export { prismaImages };
