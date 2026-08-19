"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { SubmitEvent, RefObject, useEffect, useState } from "react";
import { TableColumns } from "./useTableColumns";
import { DEFAULT_ORDER_BY, ExtraResults } from "../Table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildWhereParams } from "@/app/helpers/api";
import useSWR from "swr";
import { fetcher } from "@/app/helpers/utils";
import { getZodType } from "@/app/helpers/schema";

export type TableQuery = ReturnType<typeof useTableQuery>;

export default function useTableQuery({
	table,
	where,
	defaultTake,
	ignoreParams,
	extraParams,
	setExtraResults,
	takeRef,
	manyRelations,
	deepRelations
}: {
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, any>;
	defaultTake: number;
	ignoreParams?: string[];
	extraParams?: Record<string, string>;
	setExtraResults?: (args: ExtraResults) => void;
	takeRef: RefObject<HTMLInputElement | null>;
	manyRelations: TableColumns["manyRelations"];
	deepRelations: TableColumns["deepRelations"];
}) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [take, setTake] = useState(defaultTake);
	const [page, setPage] = useState(1);
	const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY as { field: string; order: "asc" | "desc" });
	const [whereFilter, setWhereFilter] = useState({} as Record<string, number | string>);
	const [deepRelationsFilter, setDeepRelationsFilter] = useState(
		deepRelations.reduce((acc, rel) => ({ ...acc, [rel.label]: true }), {}) as Record<string, boolean>
	);
	const [pendingFilters, setPendingFilters] = useState(0);

	function getQuery(dir?: 1 | -1) {
		const query = new URLSearchParams({
			take: take.toString(),
			page: (dir ? page + dir : page).toString(),
			orderBy: orderBy.field + "," + orderBy.order
		});

		let whereQuery = {} as Record<string, string | number>;
		if (where) {
			whereQuery = { ...where };
		}
		if (Object.values(deepRelationsFilter).includes(false)) {
			whereQuery = { ...whereQuery, ...whereFilter };
		}
		if (searchParams && searchParams.size) {
			buildWhereParams(searchParams, query, whereQuery, ignoreParams);
		}

		if (Object.keys(whereQuery).length) {
			query.set("where", JSON.stringify(whereQuery));
		}

		Object.entries(extraParams || {}).forEach(([k, v]) => query.set(k, v));

		if (manyRelations.length) {
			if (manyRelations.includes("Tags")) {
				query.set("relCounts", manyRelations.filter((r) => r !== "Tags").join(","));
				query.set("relations", "Tags");
				query.set("relationsAllFields", "true");
			} else {
				query.set("relCounts", manyRelations.join(","));
			}
		}

		if (Object.values(deepRelationsFilter).includes(false)) {
			if (Object.values(deepRelationsFilter).every((f) => !f)) {
				query.set("deepRelations", "true");
			} else {
				query.set(
					"deepRelations",
					deepRelations
						.reduce((acc, rel) => {
							if (!deepRelationsFilter[rel.label]) {
								acc.push(rel.table);
							}

							return acc;
						}, [] as string[])
						.join(",")
				);
			}
		}

		return query;
	}

	const { data, error, isLoading } = useSWR(`/api/${table}/pagination?${getQuery().toString()}`, fetcher, {
		keepPreviousData: true,
		revalidateOnFocus: false
	});

	useEffect(() => {
		if (data && data.statusMessage === "success") {
			//set to last page if page is too large
			if ((page - 1) * take > data.count) {
				// eslint-disable-next-line react-hooks/set-state-in-effect
				setPage(Math.floor(data.count / take) + 1);
			}
		}
	}, [data]);

	useEffect(() => {
		if (data && data.statusMessage === "success") {
			//pass up extra results from query
			if (setExtraResults) {
				setExtraResults({
					samples: data.samples,
					blastResult: data.BlastQueryResults,
					existingBlastDate: data.existingBlastDate
				} as ExtraResults);
			}
		}
	}, [data]);

	function resetForm() {
		//@ts-expect-error indexing collection by string
		document.forms[`${table}TableForm`].reset();
		setWhereFilter({});
		setPendingFilters(0);

		const newParams = new URLSearchParams(searchParams.toString());
		newParams.delete("search");
		router.push(`${pathname}?${newParams.toString()}`);
	}

	function handleFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		let count = 0;
		formData.delete("take");
		for (const value of formData.values()) {
			if (typeof value === "string" && value.trim()) {
				count++;
			}
		}
		setPendingFilters(count);
	}

	//filters in the column header
	function applyFilters(e: SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);

		const formTake = parseInt(formData.get("take") as string);
		formData.delete("take");

		const temp = {} as typeof whereFilter;
		for (const [field, value] of formData.entries()) {
			if (typeof value === "string" && value.trim()) {
				const type = getZodType(table, field).type;

				if (type === "string") {
					temp[field] = value;
				} else if (type === "integer") {
					temp[field] = parseInt(value);
				} else if (type === "float") {
					temp[field] = parseFloat(value);
				} else {
					temp[field] = value;
				}
			}
		}
		if (!formTake || isNaN(formTake)) {
			takeRef.current!.value = defaultTake.toString();
			if (take !== defaultTake) {
				setTake(defaultTake);
			}
		} else {
			setTake(formTake);
		}
		setWhereFilter(temp);
	}

	return {
		data,
		error,
		isLoading,
		page,
		setPage,
		take,
		setTake,
		orderBy,
		setOrderBy,
		whereFilter,
		setWhereFilter,
		deepRelationsFilter,
		setDeepRelationsFilter,
		pendingFilters,
		resetForm,
		handleFormChange,
		applyFilters,
		getQuery
	};
}
