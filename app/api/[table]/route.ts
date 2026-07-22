import { prisma } from "@/app/helpers/prisma";
import { deepWhere, parseApiQuery } from "@/app/helpers/queries";
import { getTableName } from "@/app/helpers/schema";
import { deepMerge, getLocationsInsideShapes } from "@/app/helpers/utils";
import { BlastResult, NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;

	const { sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata?.role;

	try {
		const model = getTableName(table);

		const { searchParams } = new URL(request.url);

		let { query, blast, shapes, sampleWhere } = parseApiQuery(model, searchParams, { sampleWhere: true });

		//replace the where with samp_names that match the query and are inside the shapes
		if (sampleWhere) {
			const samples = await prisma.sample.findMany({
				where: sampleWhere,
				select: {
					samp_name: true,
					decimalLatitude: true,
					decimalLongitude: true
				}
			});

			query.where = deepWhere(model, "sample", {
				samp_name: { in: getLocationsInsideShapes(samples, shapes!).map((samp) => samp.samp_name) }
			});
		}

		//inject blast results into queries
		let blastResult;
		if (blast) {
			if (blast.save && (!role || !RolePermissions[role].includes("contribute"))) {
				return NextResponse.json({
					statusMessage: "error",
					error: "You must be signed in with the contributor role to save BLAST queries."
				});
			}

			try {
				const res = await fetch(
					`${process.env.NEXT_PUBLIC_SERVER_URL}/blast/?${blast.assay_name ? `assay_name=${blast.assay_name}&` : ""}${blast.queries.map((q) => `query=${q}`).join("&")}`,
					blast.save
						? {
								headers: {
									Authorization: "Bearer " + (await getToken({ expiresInSeconds: 60 })) //manually set expire time to get fresh token
								}
							}
						: undefined
				);
				if (res.ok) {
					const response = (await res.json()) as NetworkPacket;
					if (response.statusMessage === "success") {
						blastResult = response.result as BlastResult;
						const featureWhere = deepWhere(model, "feature", {
							featureid: {
								in: blastResult.reduce(
									(acc, r) => [...acc, ...r.BlastQueryResults.map((bqr) => bqr.featureid)],
									[] as string[]
								)
							}
						});

						query.where = query.where ? deepMerge(query.where, featureWhere) : featureWhere;
					} else if (response.statusMessage === "error") {
						response.error = "Response from BLAST server: " + response.error;
						return NextResponse.json(response);
					}
				} else {
					return NextResponse.json({ statusMessage: "error", error: "Could not reach BLAST server." });
				}
			} catch {
				return NextResponse.json({ statusMessage: "error", error: "Could not reach BLAST server." });
			}
		}

		//@ts-ignore
		let result = await prisma[model].findMany(query);

		if (result) {
			//don't do this if already done
			if (shapes && !sampleWhere) {
				result = getLocationsInsideShapes(result, shapes);
			}

			return NextResponse.json({ statusMessage: "success", result, blastResults: blastResult });
		} else {
			return NextResponse.json({
				statusMessage: "error",
				error: `No ${model} matching the search parameters could be found.`
			});
		}
	} catch (err) {
		const error = err as Error;

		//TODO: replace database error messages with generic error message
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
