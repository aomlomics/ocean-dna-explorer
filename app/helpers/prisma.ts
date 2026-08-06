import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/client";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PrismaExtension = DynamicClientExtensionThis<
	Prisma.TypeMap<
		InternalArgs & {
			result: {};
			model: {};
			query: {};
			client: {};
		},
		{}
	>,
	Prisma.TypeMapCb<Prisma.PrismaClientOptions>,
	{
		result: {};
		model: {};
		query: {};
		client: {};
	}
>;

//database initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient };

//prisma client
const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL }) });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export { prisma };
