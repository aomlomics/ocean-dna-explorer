import ShowcaseClient from "./ShowcaseClient";
import { getTourShowcaseProjects } from "./data";

// Tour pages are meant to display fresh data each load but don't need
// per-request dynamic rendering. revalidate=0 keeps this fully dynamic,
// which is fine for an admin-driven tour that runs occasionally.
export const revalidate = 0;

const DEFAULT_PROJECT_DURATION_SECONDS = 40;

function parseProjectDuration(value: string | string[] | undefined) {
	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_PROJECT_DURATION_SECONDS;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PROJECT_DURATION_SECONDS;
}

function parseProjectIds(value: string | string[] | undefined) {
	const raw = Array.isArray(value) ? value[0] : value;
	if (!raw) return [];
	return Array.from(
		new Set(
			raw
				.split(",")
				.map((id) => id.trim())
				.filter((id) => id.length > 0)
		)
	);
}

function parseTaxaPerProject(value: string | string[] | undefined) {
	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = raw ? Number.parseInt(raw, 10) : NaN;
	return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function ShowcasePage({
	searchParams
}: {
	searchParams?: Promise<{
		projectSeconds?: string | string[];
		projectDurationSeconds?: string | string[];
		projectIds?: string | string[];
		taxaPerProject?: string | string[];
	}>;
}) {
	const sp = await searchParams;

	const selectedProjectIds = parseProjectIds(sp?.projectIds);
	const taxaPerProject = parseTaxaPerProject(sp?.taxaPerProject);
	const tourable = await getTourShowcaseProjects({
		selectedProjectIds,
		taxaPerProject
	});
	const projectDurationSeconds = parseProjectDuration(sp?.projectSeconds ?? sp?.projectDurationSeconds);

	if (!tourable.length) {
		return (
			<div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-base-100 text-base-content/60">
				No projects available to showcase.
			</div>
		);
	}

	return <ShowcaseClient projects={tourable} projectDurationMs={projectDurationSeconds * 1000} />;
}
