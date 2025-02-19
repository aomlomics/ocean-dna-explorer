"use client";

import useSWR, { preload } from "swr";
import Link from "next/link";
import { fetcher } from "@/app/helpers/utils";
import PhyloPicClient from "../PhyloPicClient";
import PaginationControls from "./PaginationControls";
import { Prisma } from "@prisma/client";
import { useState } from "react";
import LoadingTaxaGrid from "./LoadingTaxaGrid";

export default function TaxaGrid({
	cols = 5,
	where,
	orderBy
}: {
	cols?: number;
	where?: Prisma.TaxonomyWhereInput;
	orderBy?: Prisma.TaxonomyOrderByWithAggregationInput;
}) {
	const [page, setPage] = useState(1);

	function handlePageHover(dir = 1) {
		let query = new URLSearchParams({
			take: (cols ** 2).toString(),
			page: (page + dir).toString()
		});
		if (where) {
			query.set("where", JSON.stringify(where));
		}
		if (orderBy) {
			query.set("orderBy", JSON.stringify(orderBy));
		}

		preload(`/api/pagination/taxonomy?${query.toString()}`, fetcher);
	}

	let query = new URLSearchParams({
		take: (cols ** 2).toString(),
		page: page.toString()
	});
	if (where) {
		query.set("where", JSON.stringify(where));
	}
	if (orderBy) {
		query.set("orderBy", JSON.stringify(orderBy));
	}
	const { data, error, isLoading } = useSWR(`/api/pagination/taxonomy?${query.toString()}`, fetcher);
	if (isLoading) return <LoadingTaxaGrid cols={cols} />;
	if (error || data.error) return <div>failed to load: {error || data.error}</div>;

	return (
		<div className="space-y-6 p-6">
			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={cols ** 2}
				count={data.count}
				handlePage={(dir?: number) => setPage(dir ? page + dir : page + 1)}
				handlePageHover={handlePageHover}
			/>

			<div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
				{data.result.map((d: any) => (
					<Link
						href={`/explore/taxonomy/${encodeURIComponent(d.taxonomy)}`}
						key={d.taxonomy}
						className="card bg-base-200 hover:translate-x-1 transition-transform duration-200 aspect-square"
					>
						<div className="card-body p-4">
							<div className="tooltip tooltip-primary w-full break-words" data-tip={d.taxonomy}>
								<div>
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
							<div className="grow">
								<PhyloPicClient taxonomy={d} />
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
