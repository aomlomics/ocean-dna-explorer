"use client";

import Link from "next/link";
import PhyloPicClient from "@/app/components/images/PhyloPicClient";
import type { TaxonomyModel } from "@/app/generated/prisma/models/Taxonomy";
import { useEffect, useMemo, useState } from "react";
import TaxonomyGridTooltip, { TAXONOMY_GRID_TOOLTIP_CLASS } from "./TaxonomyGridTooltip";
import { exploreUrl } from "@/app/helpers/utils";
import { asGbifName, getBestRank, resolveGbifCommonName } from "@/app/helpers/resolveGbifCommonName";

const commonNameCache = new Map<string, string | null>();
const COMMON_NAME_CACHE_VERSION = "en-v2";

export default function TaxaGridItem({
	item,
	showCommonName = true
}: {
	item: TaxonomyModel;
	showCommonName?: boolean;
}) {
	const bestRank = useMemo(() => getBestRank(item), [item]);
	const [commonName, setCommonName] = useState<string | null>(null);
	const cacheKey = useMemo(() => `${COMMON_NAME_CACHE_VERSION}:${asGbifName(item)}`, [item]);

	useEffect(() => {
		if (!showCommonName) return;
		if (!cacheKey) return;
		if (commonNameCache.has(cacheKey)) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setCommonName(commonNameCache.get(cacheKey) ?? null);
			return;
		}

		let cancelled = false;
		resolveGbifCommonName(item).then((name) => {
			if (cancelled) return;
			commonNameCache.set(cacheKey, name);
			setCommonName(name);
		});
		return () => {
			cancelled = true;
		};
	}, [cacheKey, item, showCommonName]);

	return (
		<Link
			href={exploreUrl({ table: "taxonomy", taxonomy: item.taxonomy })}
			key={item.taxonomy}
			className="card relative z-0 hover:z-50 bg-base-200 hover:bg-base-300 transition-colors duration-200 aspect-square overflow-visible"
		>
			<div className="card-body p-2 lg:p-3 gap-0">
				<TaxonomyGridTooltip tip={item.taxonomy} className="w-full mb-2">
					{bestRank ? (
						<div className="flex flex-col gap-0.5">
							<p className="text-primary text-xs font-medium leading-4 h-4">{bestRank.label}:</p>
							<p className="wrap-break-word text-sm leading-4">{bestRank.value}</p>
							{showCommonName ? (
								<p className="text-xs text-base-content/85 min-h-4 leading-4">
									{commonName ? commonName : "No common name found"}
								</p>
							) : null}
						</div>
					) : (
						<p className="text-sm text-error">Error: no taxonomy rank found</p>
					)}
				</TaxonomyGridTooltip>

				<div className="grow min-h-0 border-t pt-2">
					<PhyloPicClient taxonomy={item} tooltipClassName={TAXONOMY_GRID_TOOLTIP_CLASS} />
				</div>
			</div>
		</Link>
	);
}
