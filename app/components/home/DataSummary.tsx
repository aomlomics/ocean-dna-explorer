import { trustedPrisma } from "@/app/helpers/prisma";
import Link from "next/link";
import type { ReactNode } from "react";
import DoughnutChart from "../charts/DoughnutChart";
import { OccurrenceIcon, ProjectIcon, SampleIcon, TaxonomyIcon } from "@/app/components/icons";
import { StatCountUp } from "./StatCountUp";
import type { AssayModel } from "@/app/generated/prisma/models/Assay";

export type SummaryItemData = {
	title: string;
	value: number;
	href: string;
	icon?: ReactNode;
};

export async function AssayStats({ compact = false }: { compact?: boolean } = {}) {
	const analyses = await trustedPrisma.analysis.findMany({
		select: {
			_count: {
				select: {
					Assignments: true
				}
			},
			Assay: {
				select: {
					target_gene: true
				}
			}
		}
	});

	const countsByGene = {} as Record<AssayModel["target_gene"], number>;
	for (const a of analyses) {
		const count = (countsByGene[a.Assay.target_gene] ??= 0);
		countsByGene[a.Assay.target_gene] = count + a._count.Assignments;
	}

	return (
		<div className="w-full flex justify-center mt-4">
			<div className="w-full max-w-4xl">
				<DoughnutChart labels={Object.keys(countsByGene)} data={Object.values(countsByGene)} compact={compact} />
			</div>
		</div>
	);
}

export function MainStatsSkeleton() {
	return (
		<div className="w-full max-w-4xl mx-auto" aria-busy="true" aria-label="Loading summary statistics">
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{[0, 1, 2, 3].map((index) => (
					<div key={index} className={`${index >= 2 ? "hidden lg:block" : ""}`}>
						<div className="flex flex-col items-center text-center p-1.5">
							<div className="skeleton h-14 w-14 shrink-0 rounded-full mb-1.5" />
							<div className="skeleton h-8 w-24 max-w-[90%] mb-1.5" />
							<div className="skeleton h-4 w-20" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export async function MainStats() {
	const { projectCount, sampleCount, taxaCount, occurrenceCount } = await trustedPrisma.$transaction(
		async (tx) => {
			const projectCount = await tx.project.count();
			const sampleCount = await tx.sample.count();
			const taxaCount = await tx.taxonomy.count();
			const occurrenceCount = await tx.occurrence.count();

			return { projectCount, sampleCount, taxaCount, occurrenceCount };
		},
		{
			timeout: 1 * 60 * 1000
		}
	);

	const summaryItems = [
		{
			title: "Projects",
			value: projectCount,
			href: "/explore/project",
			icon: <ProjectIcon className="size-10!" />
		},
		{
			title: "Samples",
			value: sampleCount,
			href: "/explore/sample",
			icon: <SampleIcon className="size-10!" />
		},
		{
			title: "Taxa",
			value: taxaCount,
			href: "/explore/taxonomy",
			icon: <TaxonomyIcon className="size-10!" />
		},
		{
			title: "Occurrences",
			value: occurrenceCount,
			href: "/explore/occurrence",
			icon: <OccurrenceIcon className="size-10!" />
		}
	];

	return (
		<div className="w-full max-w-4xl mx-auto">
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{summaryItems.map((item, index) => (
					<div key={item.title} className={`${index >= 2 ? "hidden lg:block" : ""}`}>
						<DataSummaryItem {...item} />
					</div>
				))}
			</div>
		</div>
	);
}

function DataSummaryItem({ title, value, href, icon }: SummaryItemData) {
	return (
		<Link
			href={href}
			className="group flex flex-col items-center text-center p-1.5 rounded-lg hover:bg-base-200 transition-all duration-300 hover:scale-105"
		>
			{icon && <div className="w-14 h-14 mb-1.5 flex shrink-0 items-center justify-center text-primary">{icon}</div>}
			<div className="text-2xl sm:text-3xl font-bold text-primary mb-0.5 group-hover:text-primary-focus transition-colors leading-tight">
				<StatCountUp value={value} />
			</div>
			<div className="text-xs sm:text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider leading-snug">
				{title}
			</div>
		</Link>
	);
}
