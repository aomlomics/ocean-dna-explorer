"use client";

import InfoButton from "@/app/components/InfoButton";
import { DEFAULT_TOUR_STEP_TIME, TourContext, TourStep } from "@/app/hooks/TourProvider";
import { NetworkPacket } from "@/types/globals";
import { useAuth } from "@clerk/clerk-react";
import { Fragment, useContext, useEffect, useReducer, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function Tour() {
	const startTour = useContext(TourContext);
	const { signOut } = useAuth();

	const [loading, setLoading] = useState(true);
	const [projects, setProjects] = useState([] as string[]);
	const [tourSteps, setTourSteps] = useReducer(
		(
			state: (TourStep & { invalid?: boolean })[],
			update?:
				| ({ i: number } & (
						| { delete: true; value?: undefined; shift?: undefined }
						| {
								delete?: undefined;
								value: TourStep;
								shift?: undefined;
						  }
						| { delete?: undefined; value?: undefined; shift: -1 | 1 }
				  ))
				| (TourStep & { invalid?: boolean })[]
				| undefined
		) => {
			if (update) {
				if (Array.isArray(update)) {
					return update;
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
					const temp = [...state];
					temp[update.i] = { ...temp[update.i], ...update.value };
					return temp;
				}
			} else {
				const temp = [...state];
				temp.push({ url: "" });
				return temp;
			}
		},
		[]
	);

	async function generateTourSteps(selectedProject?: string) {
		//project
		let project_id = selectedProject;
		if (!project_id) {
			const res = await fetch("/api/project?fields=project_id");
			if (res.ok) {
				const response = (await res.json()) as NetworkPacket;
				if (response.statusMessage === "success" && response.result[0]) {
					project_id = response.result[0].project_id as string;
				}
			}
		}

		let samp_name;
		let assay_name;
		let analysis_run_name;
		if (project_id) {
			//sample
			const sampRes = await fetch(
				`/api/sample?fields=samp_name&limit=1&advanced=[["project_id","equals","${project_id}"]]`
			);
			if (sampRes.ok) {
				const response = (await sampRes.json()) as NetworkPacket;
				if (response.statusMessage === "success" && response.result[0]) {
					samp_name = response.result[0].samp_name;
				}
			}

			//assay
			const assayRes = await fetch(
				`/api/assay?fields=assay_name&limit=1&advanced=[["sample","samp_name","equals","${samp_name}"]]`
			);
			if (assayRes.ok) {
				const response = (await assayRes.json()) as NetworkPacket;
				if (response.statusMessage === "success" && response.result[0]) {
					assay_name = response.result[0].assay_name;
				}
			}

			//analysis
			const analysisRes = await fetch(
				`/api/analysis?fields=analysis_run_name&limit=1&advanced=[["assay_name","equals","${assay_name}"],["project_id","equals","${project_id}"]]`
			);
			if (analysisRes.ok) {
				const response = (await analysisRes.json()) as NetworkPacket;
				if (response.statusMessage === "success" && response.result[0]) {
					analysis_run_name = response.result[0].analysis_run_name;
				}
			}
		}

		let taxonomy;
		let featureid;
		if (analysis_run_name) {
			const taxaRes = await fetch(
				`/api/taxonomy?fields=taxonomy&limit=1&advanced=[["assignment","analysis_run_name","equals","${analysis_run_name}"]]`
			);
			if (taxaRes.ok) {
				const response = (await taxaRes.json()) as NetworkPacket;
				if (response.statusMessage === "success" && response.result[0]) {
					taxonomy = response.result[0].taxonomy;
				}
			}

			const featureRes = await fetch(
				`/api/feature?fields=featureid&limit=1&advanced=[["occurrence","analysis_run_name","equals","${analysis_run_name}"]]`
			);
			if (featureRes.ok) {
				const response = (await featureRes.json()) as NetworkPacket;
				if (response.statusMessage === "success" && response.result[0]) {
					featureid = response.result[0].featureid;
				}
			}
		}

		setTourSteps([
			{ url: "/" },
			{ url: "/#dataSummary" },
			{ url: "/#dataTaxa" },
			{ url: "/explore/project" },
			{ url: project_id ? `/explore/project/${project_id}#project` : "/search?table=project" },
			{
				url: project_id ? `/search?table=sample&advanced=[["project_id","equals","${project_id}"]]` : "/explore/sample"
			},
			{ url: samp_name ? `/explore/sample/${samp_name}#sample` : "/search?table=sample" },
			{ url: assay_name ? `/explore/assay/${assay_name}#assay` : "/explore/assay" },
			{ url: assay_name ? `/explore/assay/${assay_name}#primerSection` : "/search?table=assay" },
			{ url: analysis_run_name ? `/explore/analysis/${analysis_run_name}#analysis` : "/explore/analysis" },
			{ url: analysis_run_name ? `/explore/analysis/${analysis_run_name}#dataExplorer` : "/search?table=analysis" },
			{ url: taxonomy ? `/explore/taxonomy/${taxonomy}#taxonomy` : "/search?table=taxonomy" },
			{ url: featureid ? `/explore/feature/${featureid}#feature` : "/search?table=feature" },
			{
				url: `/visualize/metadata${project_id ? `?advanced=[["project","project_id","equals","${project_id}"]]` : ""}`,
				stepTime: 3
			},
			{
				url: `/visualize/metadata${project_id ? `?advanced=[["project","project_id","equals","${project_id}"]]` : ""}#sampleScatter`
			},
			{
				url: `/visualize/taxonomy${project_id ? `?advanced=[["project","project_id","equals","${project_id}"]]` : ""}`,
				stepTime: 3
			},
			{
				url: `/visualize/taxonomy${project_id ? `?advanced=[["project","project_id","equals","${project_id}"]]` : ""}#taxaBar`
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
		async function fetchProjects() {
			const projectIdRes = await fetch("/api/project?fields=project_id");
			if (projectIdRes.ok) {
				const response = (await projectIdRes.json()) as NetworkPacket;
				if (response.statusMessage === "success") {
					setProjects(response.result.map((r: { project_id: string }) => r.project_id).sort());
				}
			}
		}

		fetchProjects();
		generateTourSteps();
	}, []);

	const checkUrl = useDebouncedCallback(async (i: number, url: string) => {
		const res = await fetch(url);
		setTourSteps({ i, value: { invalid: !res.ok } });
	}, 300);

	return (
		<>
			<select defaultValue="Pick a color" className="select">
				<option disabled={true}>Pick a Project</option>
				{projects.map((id) => (
					<option key={id}>{id}</option>
				))}
			</select>
			<div className="grid grid-cols-[6%_5%_42%_42%_5%] gap-y-2 py-2">
				<button className="btn btn-success p-2 justify-self-center" onClick={() => setTourSteps()} disabled={loading}>
					Add Step
				</button>

				<div className="self-center justify-self-center">Step</div>

				<div className="flex items-center">
					URL <span className="text-primary text-xs pl-5">(Required)</span>
				</div>

				<div className="flex items-center">
					Step Time <span className="text-primary text-xs pl-5">({DEFAULT_TOUR_STEP_TIME} Seconds)</span>
				</div>

				<div></div>

				{tourSteps.map((step, i) => (
					<Fragment key={i}>
						<div className="flex gap-1 justify-self-center">
							<button
								className="btn aspect-square p-2"
								onClick={() => setTourSteps({ i, shift: -1 })}
								disabled={i === 0}
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
								disabled={i === tourSteps.length - 1}
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

						<div className="self-center justify-self-center">{i + 1}</div>

						<div className="w-full pr-2">
							<input
								className={`input w-full${tourSteps[i].url && !tourSteps[i].invalid ? "" : " input-error"}`}
								value={step.url}
								onChange={(e) => {
									const url = e.currentTarget.value;
									setTourSteps({ i, value: { url } });
									checkUrl(i, url);
								}}
							/>
						</div>

						<input
							className="input w-full"
							type="number"
							value={step.stepTime || ""}
							onChange={(e) => setTourSteps({ i, value: { stepTime: parseInt(e.currentTarget.value) } })}
							placeholder="Step time in seconds..."
						/>

						<button
							className="btn btn-error aspect-square p-2 justify-self-center"
							onClick={() => setTourSteps({ i, delete: true })}
						>
							<svg fill="black" className="w-full h-full" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M20 6h-3.155a.949.949 0 0 0-.064-.125l-1.7-2.124A1.989 1.989 0 0 0 13.519 3h-3.038a1.987 1.987 0 0 0-1.562.75l-1.7 2.125A.949.949 0 0 0 7.155 6H4a1 1 0 0 0 0 2h1v11a2 2 0 0 0 1.994 2h10.011A2 2 0 0 0 19 19V8h1a1 1 0 0 0 0-2zm-9.519-1h3.038l.8 1H9.681zm6.524 14H7V8h10z" />
								<path d="M14 18a1 1 0 0 1-1-1v-7a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1zM10 18a1 1 0 0 1-1-1v-7a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z" />
							</svg>
						</button>
					</Fragment>
				))}
			</div>

			<div className="flex gap-2 place-content-center">
				<button
					className="btn btn-primary"
					onClick={async () => {
						await signOut();
						startTour(tourSteps);
					}}
					disabled={loading || tourSteps.some((step) => !step.url || step.invalid)}
				>
					Start Tour
				</button>

				<InfoButton infoText="Starting a tour will sign you out." type="warning" />
			</div>
		</>
	);
}
