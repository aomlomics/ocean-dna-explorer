"use client";

import InfoButton from "@/app/components/InfoButton";
import { DEFAULT_TOUR_STEP_TIME, TourContext, TourStep } from "@/app/hooks/TourProvider";
import { NetworkPacket } from "@/types/globals";
import { useAuth } from "@clerk/react";
import { Fragment, useContext, useEffect, useReducer, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

type TourStepWithInvalid = TourStep & { invalid?: boolean };
const TAXA_PER_PROJECT_OPTIONS = [24, 36, 48, 72, 96, 120] as const;
const SHOWCASE_PATH = "/showcase";

export default function Tour() {
	const startTour = useContext(TourContext);
	const { signOut } = useAuth();

	const addRef = useRef<HTMLInputElement>(null);

	const [loading, setLoading] = useState(true);

	const [stepTime, setStepTime] = useState(DEFAULT_TOUR_STEP_TIME as number | undefined);
	const [projectDurationSeconds, setProjectDurationSeconds] = useState(30 as number | undefined);
	const [taxaPerProject, setTaxaPerProject] = useState<(typeof TAXA_PER_PROJECT_OPTIONS)[number]>(48);
	const [selectedTourProjects, setSelectedTourProjects] = useState<string[]>([]);

	const [currProject, setCurrProject] = useState("");
	const [projects, setProjects] = useState([] as string[]);
	const [currSample, setCurrSample] = useState("");
	const [samples, setSamples] = useState([] as string[]);
	const [currAnalysis, setCurrAnalysis] = useState("");
	const [analyses, setAnalyses] = useState([] as string[]);
	const [currTaxonomy, setCurrTaxonomy] = useState("");
	const [taxonomies, setTaxonomies] = useState([] as string[]);
	const [featuresEnabled, setFeaturesEnabled] = useState(false);
	const [currFeature, setCurrFeature] = useState("");
	const [features, setFeatures] = useState([] as string[]);

	const getShowcaseQueryParams = () => {
		const params = new URLSearchParams({
			projectSeconds: `${projectDurationSeconds ?? 30}`,
			taxaPerProject: `${taxaPerProject}`
		});
		if (selectedTourProjects.length && selectedTourProjects.length < projects.length) {
			params.set("projectIds", selectedTourProjects.join(","));
		}
		return params;
	};

	const getShowcaseStepUrl = () => {
		return `${SHOWCASE_PATH}?${getShowcaseQueryParams().toString()}`;
	};

	const updateShowcaseUrlParams = (url: string) => {
		if (!url) return url;
		if (!url.startsWith(SHOWCASE_PATH)) return url;
		const hashIndex = url.indexOf("#");
		const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
		return `${SHOWCASE_PATH}?${getShowcaseQueryParams().toString()}${hash}`;
	};

	const syncShowcaseStepUrls = (steps: TourStepWithInvalid[]) => {
		let changed = false;
		const next = steps.map((step) => {
			const nextUrl = updateShowcaseUrlParams(step.url);
			if (nextUrl === step.url) return step;
			changed = true;
			return { ...step, url: nextUrl };
		});
		return changed ? next : steps;
	};

	const [tourSteps, setTourSteps] = useReducer(
		(
			state: TourStepWithInvalid[],
			update:
				| ({ i: number } & (
						| { add: true; delete?: undefined; shift?: undefined; value?: undefined }
						| { add?: undefined; delete: true; shift?: undefined; value?: undefined }
						| { add?: undefined; delete?: undefined; shift: -1 | 1; value?: undefined }
						| {
								add?: undefined;
								delete?: undefined;
								shift?: undefined;
								value: Omit<TourStep, "url"> & { url?: string; invalid?: boolean };
						  }
				  ))
				| TourStep[]
		): TourStepWithInvalid[] => {
			if (Array.isArray(update)) {
				return update;
			} else if (update.add) {
				const temp = [...state];
				temp.splice(update.i - 1, 0, { url: "" });
				return temp;
			} else if (update.delete) {
				const temp = [...state];
				temp.splice(update.i, 1);
				return temp;
			} else if (update.shift) {
				const temp = [...state];
				//swap current element with element in direction of shift
				[temp[update.i], temp[update.i + update.shift]] = [temp[update.i + update.shift], temp[update.i]];
				return temp;
			} else {
				//update.value
				const temp = [...state];
				temp[update.i] = { ...temp[update.i], ...update.value };
				return temp;
			}
		},
		[]
	);

	async function generateTourSteps({
		selectedProject,
		selectedSample,
		selectedAnalysis,
		selectedTaxonomy,
		selectedFeature
	}: {
		selectedProject?: string;
		selectedSample?: string;
		selectedAnalysis?: string;
		selectedTaxonomy?: string;
		selectedFeature?: string;
	} = {}) {
		//project
		let project_id = selectedProject;
		let samp_name = selectedSample;
		let analysis_run_name = selectedAnalysis;
		let assay_name;
		let taxonomy = selectedTaxonomy;
		let featureid = selectedFeature;

		//use previous values when possible
		if (!selectedProject) {
			project_id = project_id || currProject;
			analysis_run_name = analysis_run_name || currAnalysis;

			if (!selectedAnalysis) {
				samp_name = samp_name || currSample;

				if (!selectedSample) {
					taxonomy = taxonomy || currTaxonomy;
					featureid = featureid || currFeature;
				}
			}
		}

		//query for missing values
		if (!project_id) {
			const res = await fetch("/api/project?fields=project_id");
			if (res.ok) {
				const response = (await res.json()) as NetworkPacket;
				if (response.statusMessage === "success" && response.result.length) {
					project_id = response.result[0].project_id;

					if (!projects.length) {
						setProjects(response.result.map((r: { project_id: string }) => r.project_id).sort());
					}
				}
			}
		}

		if (project_id) {
			//analysis
			if (!analysis_run_name) {
				const analysisRes = await fetch(
					`/api/analysis?fields=analysis_run_name,assay_name&advanced=[["project_id","equals","${encodeURIComponent(project_id)}"]]`
				);
				if (analysisRes.ok) {
					const response = (await analysisRes.json()) as NetworkPacket;
					if (response.statusMessage === "success") {
						if (!analyses.length || selectedProject) {
							setAnalyses(response.result.map((r: { analysis_run_name: string }) => r.analysis_run_name).sort());
						}

						if (response.result.length) {
							assay_name = response.result[0].assay_name;
							analysis_run_name = response.result[0].analysis_run_name;
						}
					}
				}
			}

			if (analysis_run_name) {
				//sample
				if (!samp_name) {
					const sampRes = await fetch(
						`/api/sample?fields=samp_name&advanced=[["occurrence","analysis_run_name","equals","${encodeURIComponent(analysis_run_name)}"]]`
					);
					if (sampRes.ok) {
						const response = (await sampRes.json()) as NetworkPacket;
						if (response.statusMessage === "success") {
							if (!samples.length || selectedProject || selectedAnalysis) {
								setSamples(response.result.map((r: { samp_name: string }) => r.samp_name).sort());
							}

							if (response.result.length) {
								samp_name = response.result[0].samp_name;
							}
						}
					}
				}

				if (samp_name) {
					//TODO: only show features for selected taxonomy
					const occRes = await fetch(
						`/api/occurrence?fields=featureid&relations=Assignment&relationsAllFields=true&advanced=[["sample","samp_name","equals","${encodeURIComponent(samp_name)}"],["analysis_run_name","equals","${encodeURIComponent(analysis_run_name)}"]]`
					);
					if (occRes.ok) {
						const response = (await occRes.json()) as NetworkPacket;
						if (response.statusMessage === "success") {
							//taxonomy and feature
							const taxaOptions = new Set() as Set<string>;
							const featOptions = new Set() as Set<string>;
							const doNewTaxa = !taxonomies.length || selectedProject || selectedAnalysis || selectedSample;
							const doNewFeats =
								featuresEnabled && (!features.length || selectedProject || selectedAnalysis || selectedSample);
							if (doNewTaxa || doNewFeats) {
								for (const occ of response.result) {
									if (doNewTaxa) {
										taxaOptions.add(occ.Assignment.taxonomy);
									}
									if (doNewFeats) {
										featOptions.add(occ.featureid);
									}
								}

								if (doNewTaxa) {
									setTaxonomies(Array.from(taxaOptions).sort());
								}
								if (doNewFeats) {
									setFeatures(Array.from(featOptions).sort());
								}
							}

							if (response.result.length) {
								taxonomy = response.result[0].Assignment.taxonomy;
								featureid = response.result[0].featureid;
							}
						}
					}
				}
			}
		}

		//update state with new values
		setCurrProject(project_id || "");
		setCurrAnalysis(analysis_run_name || "");
		setCurrSample(samp_name || "");
		setCurrTaxonomy(taxonomy || "");
		setCurrFeature(featureid || "");

		setTourSteps([
			{ url: "/ambient" },
			{ url: "/sponsors" },
			{ url: getShowcaseStepUrl() },
			{ url: "/#dataSummary" },
			{ url: "/#dataTaxa" },
			{ url: "/explore/project" },
			{ url: project_id ? `/explore/project/${encodeURIComponent(project_id)}#project` : "/search?table=project" },
			{
				url: project_id
					? `/search?table=sample&advanced=[["project_id","equals","${encodeURIComponent(project_id)}"]]`
					: "/explore/sample"
			},
			{
				url:
					project_id && samp_name
						? `/explore/sample/${encodeURIComponent(project_id)}/${encodeURIComponent(samp_name)}#sample`
						: "/search?table=sample"
			},
			{
				url:
					project_id && samp_name
						? `/explore/sample/${encodeURIComponent(project_id)}/${encodeURIComponent(samp_name)}#taxonomyChart`
						: "/search?table=sample"
			},
			{ url: assay_name ? `/explore/assay/${encodeURIComponent(assay_name)}#assay` : "/explore/assay" },
			{ url: assay_name ? `/explore/assay/${encodeURIComponent(assay_name)}#primerSection` : "/search?table=assay" },
			{
				url: analysis_run_name
					? `/explore/analysis/${encodeURIComponent(analysis_run_name)}#analysis`
					: "/explore/analysis"
			},
			{
				url: analysis_run_name
					? `/explore/analysis/${encodeURIComponent(analysis_run_name)}#dataExplorer`
					: "/search?table=analysis"
			},
			{ url: taxonomy ? `/explore/taxonomy/${encodeURIComponent(taxonomy)}#taxonomy` : "/search?table=taxonomy" },
			{ url: featureid ? `/explore/feature/${encodeURIComponent(featureid)}#feature` : "/search?table=feature" },
			{
				url: `/visualize/metadata${project_id ? `?advanced=[["project","project_id","equals","${encodeURIComponent(project_id)}"]]` : ""}`,
				stepTime: 2
			},
			{
				url: `/visualize/metadata${project_id ? `?advanced=[["project","project_id","equals","${encodeURIComponent(project_id)}"]]` : ""}#visualizations`
			},
			{
				url: `/visualize/taxonomy${project_id ? `?advanced=[["project","project_id","equals","${encodeURIComponent(project_id)}"]]` : ""}`,
				stepTime: 2
			},
			{
				url: `/visualize/taxonomy${project_id ? `?advanced=[["project","project_id","equals","${encodeURIComponent(project_id)}"]]` : ""}#visualizations`
			},
			{ url: "/learn?section=edna101#learn" },
			{ url: "/learn?section=edna101#step1" },
			{ url: "/learn?section=edna101#step2" },
			{ url: "/learn?section=edna101#step3" },
			{ url: "/learn?section=edna101#step4" },
			{ url: "/learn?section=edna101#step5" },
			{ url: "/learn?section=edna101#step6" },
			{ url: "/learn?section=edna101#step7" },
			{ url: "/learn?section=edna101#step8" },
			{ url: "/learn?section=edna101#step9" },
			{ url: "/learn?section=edna101#step10" },
			{ url: "/learn?section=edna101#step11" },
			{ url: "/learn?section=impact#learn" },
			{ url: "/learn?section=impact#step1" },
			{ url: "/learn?section=impact#step2" },
			{ url: "/learn?section=impact#step3" },
			{ url: "/learn?section=impact#step4" },
			{ url: "/learn?section=impact#step5" },
			{ url: "/about#mission" },
			{ url: "/about#team" },
			{ url: "/about#supportedBy" },
			{ url: "/about#dataStandards" }
		]);
		setLoading(false);
	}

	useEffect(() => {
		generateTourSteps();
	}, []);

	const checkUrl = useDebouncedCallback(async (i: number, url: string) => {
		const res = await fetch(url);
		setTourSteps({ i, value: { invalid: !res.ok } });
	}, 300);

	const allTourProjectsSelected = projects.length > 0 && selectedTourProjects.length === projects.length;
	const noTourProjectsSelected = selectedTourProjects.length === 0;
	const tourProjectSelectionLabel =
		projects.length === 0
			? "Loading projects..."
			: noTourProjectsSelected
				? "No projects selected"
				: allTourProjectsSelected
					? `All projects selected (${projects.length})`
					: `${selectedTourProjects.length} project${selectedTourProjects.length === 1 ? "" : "s"} selected`;

	const toggleTourProject = (projectId: string) => {
		setSelectedTourProjects((current) =>
			current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]
		);
	};

	useEffect(() => {
		setSelectedTourProjects((current) => {
			if (!projects.length) return [];
			if (!current.length) return projects;
			const available = new Set(projects);
			const retained = current.filter((id) => available.has(id));
			return retained.length ? retained : projects;
		});
	}, [projects]);

	useEffect(() => {
		const syncedSteps = syncShowcaseStepUrls(tourSteps);
		if (syncedSteps !== tourSteps) {
			setTourSteps(syncedSteps);
		}
	}, [projectDurationSeconds, taxaPerProject, selectedTourProjects, projects.length, tourSteps]);

	return (
		<>
			<h1>Showcase Page Options</h1>
			<div className="mb-3 flex flex-wrap items-end gap-4 border-b border-primary pb-3">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Project showcase time</legend>
					<div className="flex items-center gap-2">
						<input
							className="input input-sm w-24"
							type="number"
							min={1}
							value={projectDurationSeconds !== undefined ? projectDurationSeconds : ""}
							onChange={(e) => {
								const parsed = parseInt(e.currentTarget.value);
								setProjectDurationSeconds(isNaN(parsed) ? undefined : parsed);
							}}
							disabled={loading}
						/>
						<span className="text-primary text-xs">Seconds per project</span>
					</div>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomies per project</legend>
					<div className="flex items-center gap-2">
						<select
							className="select select-sm min-w-32"
							value={taxaPerProject}
							onChange={(e) =>
								setTaxaPerProject(Number(e.currentTarget.value) as (typeof TAXA_PER_PROJECT_OPTIONS)[number])
							}
							disabled={loading}
						>
							{TAXA_PER_PROJECT_OPTIONS.map((count) => (
								<option key={count} value={count}>
									{count}
								</option>
							))}
						</select>
						<span className="text-primary text-xs">Hard max is 120 to keep requests reasonable.</span>
					</div>
				</fieldset>

				<fieldset className="fieldset min-w-80">
					<legend className="fieldset-legend">Showcase projects</legend>
					<div className="mb-2 flex items-center gap-2">
						<button
							type="button"
							className="btn btn-xs"
							onClick={() => setSelectedTourProjects(projects)}
							disabled={loading || !projects.length || allTourProjectsSelected}
						>
							Select all
						</button>
						<button
							type="button"
							className="btn btn-xs"
							onClick={() => setSelectedTourProjects([])}
							disabled={loading || !projects.length || noTourProjectsSelected}
						>
							Deselect all
						</button>
					</div>
					<details className="rounded-box border border-base-300 bg-base-100">
						<summary className="cursor-pointer px-3 py-2 text-sm">{tourProjectSelectionLabel}</summary>
						<div className="max-h-64 overflow-y-auto px-3 py-2">
							{projects.length ? (
								<div className="flex flex-col gap-1.5">
									{projects.map((id) => (
										<label key={id} className="label cursor-pointer justify-start gap-2 py-0.5">
											<input
												type="checkbox"
												className="checkbox checkbox-xs checkbox-primary"
												checked={selectedTourProjects.includes(id)}
												onChange={() => toggleTourProject(id)}
												disabled={loading}
											/>
											<span className="label-text text-xs">{id}</span>
										</label>
									))}
								</div>
							) : (
								<p className="text-xs text-base-content/70">No projects available.</p>
							)}
						</div>
					</details>
				</fieldset>
			</div>

			<h1>Tour Destinations</h1>
			<div className="grid grid-cols-5 gap-2 border-b border-primary pb-2">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Project</legend>
					<select
						className="select"
						value={currProject}
						onChange={(e) => {
							setLoading(true);
							generateTourSteps({ selectedProject: e.target.value });
						}}
						disabled={loading}
					>
						<option disabled={true}>Pick a Project</option>
						{projects.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Analysis</legend>
					<select
						className="select"
						value={currAnalysis}
						onChange={(e) => {
							setLoading(true);
							generateTourSteps({ selectedAnalysis: e.target.value });
						}}
						disabled={loading}
					>
						<option disabled={true}>Pick an Analysis</option>
						{analyses.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Sample</legend>
					<select
						className="select"
						value={currSample}
						onChange={(e) => {
							setLoading(true);
							generateTourSteps({ selectedSample: e.target.value });
						}}
						disabled={loading}
					>
						<option disabled={true}>Pick a Sample</option>
						{samples.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomy</legend>
					<select
						className="select"
						value={currTaxonomy}
						onChange={(e) => {
							setLoading(true);
							generateTourSteps({ selectedTaxonomy: e.target.value });
						}}
						disabled={loading}
					>
						<option disabled={true}>Pick a Taxonomy</option>
						{taxonomies.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">
						Feature{" "}
						<InfoButton
							text="Enabling this might cause slow load times when changing other options"
							type="warning"
							className="h-4"
						/>
						<div
							className="tooltip tooltip-secondary before:text-primary-content"
							data-tip={`${featuresEnabled ? "Disable" : "Enable"} selecting Feature destination`}
						>
							<input
								type="checkbox"
								className="toggle toggle-xs"
								checked={featuresEnabled}
								onChange={async (e) => {
									setFeaturesEnabled(e.target.checked);

									if (e.target.checked) {
										setLoading(true);

										const res = await fetch(
											`/api/feature?fields=featureid&advanced=[["occurrence","analysis_run_name","equals","${encodeURIComponent(currAnalysis)}"]]`
										);
										if (res.ok) {
											const response = (await res.json()) as NetworkPacket;
											if (response.statusMessage === "success" && response.result.length) {
												setFeatures(response.result.map((r: { featureid: string }) => r.featureid).sort());
											}
										}

										setLoading(false);
									}
								}}
								disabled={loading}
							/>
						</div>
					</legend>
					<select
						className="select"
						value={currFeature}
						onChange={(e) => {
							setLoading(true);
							generateTourSteps({ selectedFeature: e.target.value });
						}}
						disabled={loading || !featuresEnabled}
					>
						<option disabled={true}>Pick a Feature</option>
						{!featuresEnabled ? <option>{currFeature}</option> : <></>}
						{features.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
				</fieldset>
			</div>

			<div className="grid grid-cols-[6%_5%_42%_42%_5%] gap-y-2 py-2">
				<form
					className="flex"
					onSubmit={(e) => {
						e.preventDefault();
						if (addRef.current) {
							const i = parseInt(addRef.current.value);
							if (i > 0 && i <= tourSteps.length + 1) {
								addRef.current.value = `${i + 1}`;
								setTourSteps({ i, add: true });
							}
						}
					}}
				>
					{tourSteps.length ? (
						<input
							ref={addRef}
							className="input pl-1.5 pr-1 w-full rounded-r-none"
							type="number"
							disabled={loading}
							defaultValue={tourSteps.length + 1}
							onChange={(e) => {
								const i = parseInt(e.target.value);
								if (i <= 0 || i > tourSteps.length + 1) {
									if (!e.target.classList.contains("input-error")) {
										e.target.classList.add("input-error");
									}
								} else {
									e.target.classList.remove("input-error");
								}
							}}
						/>
					) : (
						<input
							key={tourSteps.length}
							className="input pl-1.5 pr-1 w-full rounded-r-none"
							type="number"
							disabled
							defaultValue={1}
						/>
					)}
					<button className="btn btn-success p-1.5 justify-self-center rounded-l-none" disabled={loading}>
						Add
					</button>
				</form>

				<div className="self-center justify-self-center">Step</div>

				<div className="flex items-center">
					URL <span className="text-primary text-xs pl-5">(Required)</span>
				</div>

				<div className="flex items-center">
					Step Time{" "}
					<input
						className="input input-xs ml-5 mr-2 w-12 px-1"
						type="number"
						value={stepTime !== undefined ? stepTime : ""}
						onChange={(e) => {
							const parsed = parseInt(e.target.value);
							setStepTime(isNaN(parsed) ? undefined : parsed);

							if (parsed <= 0) {
								if (!e.target.classList.contains("input-error")) {
									e.target.classList.add("input-error");
								}
							} else {
								e.target.classList.remove("input-error");
							}
						}}
					/>{" "}
					<span className="text-primary text-xs">Seconds</span>
				</div>

				<div></div>

				{tourSteps.map((step, i) => (
					<Fragment key={i}>
						<div className="flex gap-1 justify-self-center self-center w-full">
							<button
								className="btn aspect-square p-2"
								onClick={() => setTourSteps({ i, shift: -1 })}
								disabled={loading || i === 0}
							>
								<svg
									className="w-full h-full text-primary"
									fill="currentColor"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289L19.7071 14.2929C20.0976 14.6834 20.0976 15.3166 19.7071 15.7071C19.3166 16.0976 18.6834 16.0976 18.2929 15.7071L12 9.41421L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7Z" />
								</svg>
							</button>
							<button
								className="btn aspect-square p-2"
								onClick={() => setTourSteps({ i, shift: 1 })}
								disabled={loading || i === tourSteps.length - 1}
							>
								<svg
									className="w-full h-full text-primary"
									fill="currentColor"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
									transform="rotate(180)"
								>
									<path d="M12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289L19.7071 14.2929C20.0976 14.6834 20.0976 15.3166 19.7071 15.7071C19.3166 16.0976 18.6834 16.0976 18.2929 15.7071L12 9.41421L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7Z"></path>
								</svg>
							</button>
						</div>

						<div className={`flex items-center justify-center w-full h-full${i % 2 === 0 ? " bg-base-200" : ""}`}>
							{i + 1}
						</div>

						<div className={`w-full pr-2 py-1${i % 2 === 0 ? " bg-base-200" : ""}`}>
							<input
								className={`input w-full${tourSteps[i].url && !tourSteps[i].invalid ? "" : " input-error"}`}
								value={step.url}
								onChange={(e) => {
									const url = e.currentTarget.value;
									setTourSteps({ i, value: { url } });
									checkUrl(i, url);
								}}
								disabled={loading}
							/>
						</div>

						<div className={`w-full py-1${i % 2 === 0 ? " bg-base-200" : ""}`}>
							<input
								className="input w-full"
								type="number"
								value={step.stepTime !== undefined ? step.stepTime : ""}
								onChange={(e) => {
									const parsed = parseInt(e.currentTarget.value);
									setTourSteps({ i, value: { stepTime: isNaN(parsed) ? undefined : parsed } });

									if (parsed <= 0) {
										if (!e.target.classList.contains("input-error")) {
											e.target.classList.add("input-error");
										}
									} else {
										e.target.classList.remove("input-error");
									}
								}}
								placeholder="Step time in seconds..."
								disabled={loading}
							/>
						</div>

						<div className={`flex justify-center items-center w-full h-full${i % 2 === 0 ? " bg-base-200" : ""}`}>
							<button
								className="btn btn-error aspect-square p-2"
								onClick={() => {
									if (addRef.current && parseInt(addRef.current.value) > tourSteps.length) {
										addRef.current.value = `${tourSteps.length}`;
									}

									setTourSteps({ i, delete: true });
								}}
								disabled={loading}
							>
								<svg fill="black" className="w-full h-full" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path d="M20 6h-3.155a.949.949 0 0 0-.064-.125l-1.7-2.124A1.989 1.989 0 0 0 13.519 3h-3.038a1.987 1.987 0 0 0-1.562.75l-1.7 2.125A.949.949 0 0 0 7.155 6H4a1 1 0 0 0 0 2h1v11a2 2 0 0 0 1.994 2h10.011A2 2 0 0 0 19 19V8h1a1 1 0 0 0 0-2zm-9.519-1h3.038l.8 1H9.681zm6.524 14H7V8h10z" />
									<path d="M14 18a1 1 0 0 1-1-1v-7a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1zM10 18a1 1 0 0 1-1-1v-7a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z" />
								</svg>
							</button>
						</div>
					</Fragment>
				))}
			</div>

			<div className="flex gap-2 place-content-center">
				<button
					className="btn btn-primary"
					onClick={async () => {
						await signOut();
						startTour(tourSteps, stepTime);
					}}
					disabled={
						loading ||
						(projectDurationSeconds !== undefined && projectDurationSeconds <= 0) ||
						noTourProjectsSelected ||
						tourSteps.some((step) => !step.url || step.invalid || (step.stepTime && step.stepTime <= 0)) ||
						(stepTime !== undefined && stepTime <= 0)
					}
				>
					Start Tour
				</button>

				<InfoButton text="Starting a tour will sign you out." type="warning" />
			</div>
		</>
	);
}
