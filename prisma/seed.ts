import { PrismaClient } from "@/app/generated/prisma/client";
import { seedAssays } from "@/app/helpers/queries";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL }) });

async function load() {
	await seedAssays(prisma);
}

load()
	.then(prisma.$disconnect)
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
