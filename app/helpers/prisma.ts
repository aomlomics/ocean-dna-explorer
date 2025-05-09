import { Prisma } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
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
	}).$extends({
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					const readOperations = ["findMany", "findUnique", "findFirst", "aggregate", "count", "groupBy"];
					if (readOperations.includes(operation)) {
						const { userId } = await auth();
						//@ts-ignore
						args.where = {
							//@ts-ignore
							...args.where,
							OR: [
								{
									isPrivate: false
								},
								{
									userIds: {
										has: userId
									}
								}
							]
						};
					}

					return await query(args);
				}
			}
		}
	});

// prisma.$on("query", (e) => {
// 	const logFile = fs.createWriteStream(path.join(__dirname, "prisma.log"), { flags: "a" });
// 	const logMessage = `Query: ${e.query}\nParams: ${e.params}\nDuration: ${e.duration}ms\n\n`;
// 	logFile.write(logMessage);
// 	console.log(logMessage);
// });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };

export async function batchSubmit(
	prisma: any,
	data: any[],
	table: Lowercase<Prisma.ModelName>,
	field: string,
	userId: string,
	isPrivate: boolean | undefined
) {
	console.log(table);
	const newRows = await prisma[table].createManyAndReturn({
		data,
		skipDuplicates: true,
		select: {
			[field]: true
		}
	});

	//add userId to existing (batching)
	console.log(table, "userIds");
	const existingRowsSet = new Set(newRows.map((e: { [field]: any }) => e[field]));
	const existingRows = data.reduce((acc, e) => {
		if (!existingRowsSet.has(e[field])) {
			acc.push(e[field]);
		}
		return acc;
	}, [] as string[]);
	const userIdBatches = [];
	while (existingRows.length) {
		userIdBatches.push(existingRows.splice(0, 30000));
	}
	for (let batch of userIdBatches) {
		await prisma[table].updateMany({
			where: {
				[field]: {
					in: batch
				},
				NOT: {
					userIds: {
						has: userId
					}
				}
			},
			data: {
				userIds: {
					push: userId
				}
			}
		});
	}

	//private
	console.log(table, "private");
	if (!isPrivate) {
		const privateBatches = [];
		const rows = data.map((e) => e[field]);
		while (rows.length) {
			privateBatches.push(rows.splice(0, 30000));
		}
		for (let batch of privateBatches) {
			await prisma[table].updateMany({
				where: {
					[field]: {
						in: batch
					},
					isPrivate: true
				},
				data: {
					isPrivate: false
				}
			});
		}
	}
}
