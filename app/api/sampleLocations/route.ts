import { publicPrisma } from "@/app/helpers/prisma";
import { DeadValueEnum } from "@/types/enums";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

type ProjSampleAvgLocs = {
	_avg: {
		decimalLatitude: number;
		decimalLongitude: number;
	};
	project_id: string;
	id: number;
};

export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	//maps enum to only its numeric values, discarding the string values
	const deadValues = Object.values(DeadValueEnum).filter((v) => !isNaN(Number(v))) as number[];

	try {
		const rawLocations = await publicPrisma.$transaction(async (tx) => {
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

		return NextResponse.json({ statusMessage: "success", rawLocations });
	} catch (err) {
		const error = err as Error;

		return NextResponse.json({ statusMessage: "error", error: error.message }, { status: 400 });
	}
}
