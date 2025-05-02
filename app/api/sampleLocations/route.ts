import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { DeadValueEnum } from "@/types/enums";

type ProjSampleAvgLocs = {
	_avg: {
		decimalLatitude: number;
		decimalLongitude: number;
	};
	project_id: string;
	id: number;
};

//TODO: convert to server action
export async function GET(request: Request) {
	//maps enum to only its numeric values, discarding the string values
	const deadValues = Object.values(DeadValueEnum).filter((v) => !isNaN(Number(v))) as number[];

	try {
		const rawLocations = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const projectsRes = await tx.project.findMany({
				select: {
					project_id: true,
					id: true
				}
			});
			//convert array of projects into object where keys are project_id and values are database id
			const projects = projectsRes.reduce((accum, project) => ({ ...accum, [project.project_id]: project.id }), {});

			const rawLocations = await tx.sample.groupBy({
				by: ["project_id"],
				_avg: {
					decimalLatitude: true,
					decimalLongitude: true
				},
				where: {
					AND: [
						{
							NOT: {
								decimalLatitude: {
									in: deadValues
								}
							}
						},
						{
							NOT: {
								decimalLongitude: {
									in: deadValues
								}
							}
						}
					]
				}
			});

			for (const project of rawLocations as ProjSampleAvgLocs[]) {
				project.id = projects[project.project_id as keyof typeof projects];
			}

			return rawLocations;
		});

		return Response.json({ statusMessage: "success", rawLocations });
	} catch (err) {
		const error = err as Error;

		return Response.json({ statusMessage: "error", error: error.message }, { status: 400 });
	}
}
