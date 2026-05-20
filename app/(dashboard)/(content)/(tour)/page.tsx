import TourController from "./TourController";
import { getTourShowcaseProjects } from "./showcase/data";

// The TV tour should reflect newly public project data whenever it is loaded.
export const revalidate = 0;

const DEFAULT_PROJECT_DURATION_SECONDS = 30;

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

export default async function TourPage({
	searchParams
}: {
	searchParams?: {
		projectSeconds?: string | string[];
		projectDurationSeconds?: string | string[];
		projectIds?: string | string[];
		taxaPerProject?: string | string[];
	};
}) {
	const selectedProjectIds = parseProjectIds(searchParams?.projectIds);
	const taxaPerProject = parseTaxaPerProject(searchParams?.taxaPerProject);
	const projects = await getTourShowcaseProjects({
		selectedProjectIds,
		taxaPerProject
	});
	const projectDurationSeconds = parseProjectDuration(
		searchParams?.projectSeconds ?? searchParams?.projectDurationSeconds
	);

	if (!projects.length) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-base-100 text-base-content/60">
				No public projects available to showcase.
			</div>
		);
	}

	return <TourController projects={projects} projectDurationMs={projectDurationSeconds * 1000} />;
}
