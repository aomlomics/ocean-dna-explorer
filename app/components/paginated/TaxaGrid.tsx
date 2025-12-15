"use client";

import useSWR, { preload } from "swr";
import Link from "next/link";
import { fetcher } from "@/app/helpers/utils";
import PaginationControls from "./PaginationControls";
import { Prisma } from "@/app/generated/prisma/client";
import { useState } from "react";
import LoadingTaxaGrid from "./LoadingTaxaGrid";
import { useSearchParams } from "next/navigation";
import { NetworkPacket } from "@/types/globals";
import PhyloPicClient from "../images/PhyloPicClient";

export default function TaxaGrid({
	where,
	orderBy,
	ignoreParams
}: {
	where?: Prisma.TaxonomyWhereInput;
	orderBy?: Prisma.TaxonomyOrderByWithAggregationInput;
	ignoreParams?: string[];
}) {
	const searchParams = useSearchParams();
	const [page, setPage] = useState(1);

	let query = new URLSearchParams({
		take: (25).toString(),
		page: page.toString()
	});

	let whereQuery = {} as Prisma.TaxonomyWhereInput;
	if (where) {
		whereQuery = { ...where };
	}
	if (searchParams) {
		whereQuery = { ...whereQuery, ...Object.fromEntries(searchParams) };
		if (ignoreParams) {
			for (const param of ignoreParams) {
				delete whereQuery[param as keyof Prisma.TaxonomyWhereInput];
			}
		}
	}
	query.set("where", JSON.stringify(whereQuery));

	if (orderBy) {
		query.set("orderBy", JSON.stringify(orderBy));
	}

	const { data, error, isLoading }: { data: NetworkPacket; error: any; isLoading: boolean } = useSWR(
		`/api/taxonomy/pagination?${query.toString()}`,
		fetcher,
		{
			keepPreviousData: true
		}
	);
	if (isLoading || !data) return <LoadingTaxaGrid />;
	if (error) return <div>failed to load: {error}</div>;
	if (data.statusMessage === "error" || !data.result) {
		return <div>failed to load: {data.error || "no result found"}</div>;
	}

	// Ensure we always have an array to map over and a sensible count fallback
	const items = Array.isArray((data as any).result) ? (data as any).result : [];
	const totalCount = typeof (data as any).count === "number" ? (data as any).count : items.length;

	function handlePageHover(dir = 1) {
		let query = new URLSearchParams({
			take: (25).toString(),
			page: (page + dir).toString()
		});
		if (where) {
			query.set("where", JSON.stringify(where));
		}
		if (orderBy) {
			query.set("orderBy", JSON.stringify(orderBy));
		}

		preload(`/api/taxonomy/pagination?${query.toString()}`, fetcher);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={25}
				count={totalCount}
				handlePage={(dir?: number) => setPage(dir ? page + dir : page + 1)}
				handlePageHover={handlePageHover}
			/>

			<div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
				{items.map((d: any) => (
					<Link
						href={`/explore/taxonomy/${encodeURIComponent(d.taxonomy)}`}
						key={d.taxonomy}
						className="card bg-base-200 hover:bg-base-300 transition-colors duration-200 aspect-square"
					>
						<div className="card-body p-1 lg:p-2 gap-0">
							<div className="tooltip tooltip-primary w-full break-words before:!w-full before:bg-base-100 before:text-base-content before:border before:border-base-300" data-tip={d.taxonomy}>
								<div className="mb-1">
									{d.species ? (
										<>
											<p className="text-primary">Species:</p> <p className="break-words">{d.species}</p>
										</>
									) : d.genus ? (
										<>
											<p className="text-primary">Genus:</p> <p className="break-words">{d.genus}</p>
										</>
									) : d.family ? (
										<>
											<p className="text-primary">Family:</p> <p className="break-words">{d.family}</p>
										</>
									) : d.order ? (
										<>
											<p className="text-primary">Order:</p> <p className="break-words">{d.order}</p>
										</>
									) : d.taxonClass ? (
										<>
											<p className="text-primary">Class:</p> <p className="break-words">{d.taxonClass}</p>
										</>
									) : d.phylum ? (
										<>
											<p className="text-primary">Phylum:</p> <p className="break-words">{d.phylum}</p>
										</>
									) : d.subdivision ? (
										<>
											<p className="text-primary">Subdivision:</p> <p className="break-words">{d.subdivision}</p>
										</>
									) : d.division ? (
										<>
											<p className="text-primary">Division:</p> <p className="break-words">{d.division}</p>
										</>
									) : d.supergroup ? (
										<>
											<p className="text-primary">Supergroup:</p> <p className="break-words">{d.supergroup}</p>
										</>
									) : d.kingdom ? (
										<>
											<p className="text-primary">Kingdom:</p> <p className="break-words">{d.kingdom}</p>
										</>
									) : d.domain ? (
										<>
											<p className="text-primary">Domain:</p> <p className="break-words">{d.domain}</p>
										</>
									) : (
										"Error"
									)}
								</div>
							</div>
							<div className="grow border-t-1 pt-1">
								<PhyloPicClient taxonomy={d} />
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
