"use client";

import { type SubmitEvent, type RefObject, useEffect, useState } from "react";
import type { TableColumns } from "./useTableColumns";
import { DEFAULT_ORDER_BY, type ExtraResults } from "../Table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildParams } from "@/app/helpers/api";
import useSWR from "swr";
import { fetcher } from "@/app/helpers/utils";
import { getZodType } from "@/app/helpers/schema";
import type { ModelName } from "@/types/tableMetadata";
import { useTrusted } from "@/app/hooks/TrustedProvider";

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
	table: Uncapitalize<ModelName>;
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
	const { trusted } = useTrusted();

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
			ignoreExtraOptions: "true",
			limit: take.toString(),
			page: (dir ? page + dir : page).toString(),
			orderBy: orderBy.field + "," + orderBy.order
		});

		if (trusted) {
			query.set("trusted", "true");
		}

		let whereQuery = {} as Record<string, string | number>;
		if (where) {
			for (const [field, value] of Object.entries(where)) {
				if (typeof value === "object") {
					whereQuery[field] = value;
				} else {
					query.set(field, value);
				}
			}
		}
		if (Object.keys(whereQuery).length) {
			query.set("where", JSON.stringify(whereQuery));
		}

		for (const [field, value] of Object.entries(whereFilter)) {
			query.set(field, value.toString());
		}

		if (searchParams && searchParams.size) {
			buildParams(searchParams, query, ignoreParams);
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

		const deepRelsToGet = deepRelations.reduce((acc, rel) => {
			if (!deepRelationsFilter[rel.label]) {
				acc.push(rel.table);
			}

			return acc;
		}, [] as string[]);

		if (deepRelsToGet.length === deepRelations.length) {
			query.set("deepRelations", "true");
		} else if (deepRelsToGet.length) {
			query.set("deepRelations", deepRelsToGet.join(","));
		}

		return query;
	}

	const strQuery = getQuery().toString();
	const { data, error, isLoading } = useSWR(`/api/internal/${table}/pagination?${strQuery}`, fetcher, {
		keepPreviousData: true,
		revalidateOnFocus: false
	});
	const {
		data: countData,
		error: countError,
		isLoading: countIsLoading
	} = useSWR(`/api/${table}/count?${strQuery}`, fetcher, {
		keepPreviousData: true,
		revalidateOnFocus: false
	});

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
		countData,
		countError,
		countIsLoading,
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
