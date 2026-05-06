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

export default async function TourPage({
	searchParams
}: {
	searchParams?: { projectSeconds?: string | string[]; projectDurationSeconds?: string | string[] };
}) {
	const projects = await getTourShowcaseProjects();
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
