import { PrismaClient } from "../generated/prisma/client";
// import fs from "fs";
// import path from "path";

//BLACK MAGIC DO NOT TOUCH
//database initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		log: [
			// {
			// 	emit: "event",
			// 	level: "query"
			// },
			{
				emit: "stdout",
				level: "error"
			},
			{
				emit: "stdout",
				level: "info"
			},
			{
				emit: "stdout",
				level: "warn"
			}
		]
	});

// prisma.$on("query", (e) => {
// 	const logFile = fs.createWriteStream(path.join(__dirname, "prisma.log"), { flags: "a" });
// 	const logMessage = `Query: ${e.query}\nParams: ${e.params}\nDuration: ${e.duration}ms\n\n`;
// 	logFile.write(logMessage);
// 	console.log(logMessage);
// });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
