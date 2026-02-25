"use client";

import { Prisma, Taxonomy } from "@/app/generated/prisma/client";
import Grid from "./Grid";
import TaxaGridItem from "./TaxaGridItem";

export default function TaxaGrid({
	where,
	orderBy,
	ignoreParams
}: {
	where?: Prisma.TaxonomyWhereInput;
	orderBy?: { field: keyof Taxonomy; order: Prisma.SortOrder };
	ignoreParams?: string[];
}) {
	return <Grid Child={TaxaGridItem} table={"taxonomy"} where={where} orderBy={orderBy} ignoreParams={ignoreParams} />;
}
