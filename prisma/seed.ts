import { PrismaClient } from "@/app/generated/prisma/client";

const prisma = new PrismaClient();

async function load() {
	try {
		//build default database configuration here
	} catch (err) {
		console.error(err);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

load();
