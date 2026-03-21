import { PrismaClient } from "@/app/generated/prisma/client";
import { seedAssays } from "@/app/helpers/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.POSTGRES_URL_NON_POOLING }) });
const ASSAY_SEED_URL =
	"https://raw.githubusercontent.com/NOAA-Omics/noaa-omics-metabarcoding-assays/refs/heads/main/assays.tsv";

async function load() {
	try {
		await seedAssays(prisma, ASSAY_SEED_URL);
	} catch (err) {
		console.error(err);
		await prisma.$disconnect();
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

load();
