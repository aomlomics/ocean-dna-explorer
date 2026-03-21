import { PrismaClient } from "@/app/generated/prisma/client";
import { seedAssays } from "@/app/helpers/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

console.log("TEST", process.env.ASSAY_SEED_URL, process.env.POSTGRES_PRISMA_URL);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL }) });
async function load() {
	try {
		await seedAssays(prisma, process.env.ASSAY_SEED_URL);
	} catch (err) {
		console.error(err);
		await prisma.$disconnect();
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

load();
