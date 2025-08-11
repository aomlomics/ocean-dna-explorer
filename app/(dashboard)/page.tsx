import { getSummaryData, MainStats, AssayStats, SummaryItemData } from "@/app/components/DataSummary";
import Link from "next/link";
import ThemeAwareLogo from "../components/images/ThemeAwareLogo";
import { DeadValueEnum } from "@/types/enums";
import { publicPrisma } from "../helpers/prisma";
import Map from "../components/map/Map";
import { randomColors } from "../helpers/utils";
// import OrganismOutlines from "../components/images/OrganismOutlines";
import fs from "fs";
import path from "path";
import Carousel from "../components/images/Carousel";

export default async function Home() {
	const deadValues = Object.values(DeadValueEnum).filter((v) => !isNaN(Number(v))) as number[];

	const samples = await publicPrisma.sample.findMany({
		select: {
			samp_name: true,
			project_id: true,
			decimalLatitude: true,
			decimalLongitude: true
		},
		where: {
			AND: [
				{
					NOT: {
						decimalLatitude: {
							in: deadValues
						}
					}
				},
				{
					NOT: {
						decimalLongitude: {
							in: deadValues
						}
					}
				}
			]
		}
	});

	const uniqueProjects = samples.reduce((acc: string[], a) => {
		if (!acc.includes(a.project_id)) {
			acc.push(a.project_id);
		}

		return acc;
	}, []);
	const colors = randomColors(uniqueProjects.length);
	const projectColors = {} as Record<string, string>;
	for (let i = 0; i < colors.length; i++) {
		projectColors[uniqueProjects[i]] = colors[i];
	}

	const locations = samples.map((samp) => ({ ...samp, color: projectColors[samp.project_id] }));

	const outlinesDir = path.join(process.cwd(), "public/images/outlines");
	const allOutlines = fs.readdirSync(outlinesDir);

	// Build carousel image list from public/images/carousel
	const carouselDir = path.join(process.cwd(), "public/images/carousel");
	let carouselImages: string[] = [];
	try {
		carouselImages = fs
			.readdirSync(carouselDir)
			.filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
			.sort()
			.map((f) => `/images/carousel/${f}`);
	} catch (_) {
		// If folder missing in some envs, fallback to a small known-good set that exists in repo
		carouselImages = [
			"/images/carousel/adobe_copepod.jpeg",
			"/images/carousel/adobe_jellyfish.jpeg",
			"/images/carousel/apr16_1_hires.jpg"
		];
	}

	const { projectCount, sampleCount, taxaCount, occurrenceCount, uniqueAssays } = await getSummaryData();

	const summaryItems: SummaryItemData[] = [
		{ title: "Projects", value: projectCount, href: "/explore/project", icon: "ship" },
		{ title: "Samples", value: sampleCount, href: "/explore/sample", icon: "location" },
		{ title: "Taxonomies", value: taxaCount, href: "/explore/taxonomy", icon: "fish" },
		{ title: "Occurrence Records", value: occurrenceCount, href: "/explore/occurrence", icon: "eye" }
	];

	return (
		<main className="flex flex-col grow bg-base-400 text-base-content">
			{/* <div className="relative w-full h-[60vh] z-content-overlay bg-base-200 mb-4"></div> */}
			<div className="relative w-full h-[65vh] z-content-overlay bg-base-100 mb-4">
				{/* Background carousel */}
				<div
					className="absolute inset-0"
					style={{
						WebkitMaskImage: "radial-gradient(150% 120% at 50% 110%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 95%)",
						maskImage: "radial-gradient(150% 120% at 50% 110%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 95%)",
					}}
				>
					<Carousel images={carouselImages} />
				</div>
				{/* Single scrim for readability over the image */}
				<div className="absolute inset-0 bg-base-100/55 dark:bg-base-100/25 backdrop-blur-[1px]" />
				{/* Bottom mask that blends hero into the page by revealing content below */}
				<div
					className="absolute inset-x-0 bottom-0 h-48 sm:h-56 md:h-72"
					style={{
						WebkitMaskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
						maskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
						backgroundColor: "transparent",
					}}
				/>
				{/* Dark mode: keep existing straight fade */}
				{/* Dark mode: radiant blue glow overlay */}
				<div
					className="absolute inset-0 hidden dark:block pointer-events-none"
					style={{
						backgroundImage:
							"radial-gradient(120% 90% at 50% 100%, rgba(56,116,255,0.8) 0%, rgba(56,116,255,0.45) 36%, rgba(56,116,255,0.18) 60%, rgba(56,116,255,0.06) 72%, rgba(0,0,0,0) 86%), linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.65) 38%, rgba(0,0,0,0) 78%)",
						backgroundBlendMode: "screen, normal",
					}}
				/>
				{/* Hero content */}
				<div className="absolute inset-0 flex items-center z-content">
					<div className="w-full px-4 sm:px-4 md:px-6 lg:px-8 xl:px-8 max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] xl:max-w-[85%] mx-auto">
						<div className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
							<h1 className="text-6xl sm:text-7xl md:text-7xl lg:text-7xl xl:text-8xl font-light leading-[0.9] sm:leading-[0.95] mb-2 sm:mb-2">
								<span className="block text-primary font-light">Welcome</span>
							</h1>

							<div className="text-base-content/90 font-normal -mt-1 sm:-mt-2">
								<span className="block text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-5xl leading-tight mb-2 sm:mb-3">
									to the <span className="text-primary">Ocean DNA Explorer</span>
								</span>

								<div className="text-lg sm:text-xl md:text-xl lg:text-xl xl:text-2xl leading-relaxed sm:leading-snug text-base-content max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mb-6 sm:mb-8 lg:mb-10">
									<span className="block">
										a data sharing platform, search engine, and visualization and analysis tool for ocean environmental
										DNA data
									</span>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
								<Link
									href="#dataSummary"
									className="btn btn-md sm:btn-md lg:btn-lg btn-secondary bg-primary/90 backdrop-blur-sm outline-none text-white font-normal hover:bg-primary transition-all duration-300 text-base sm:text-base lg:text-lg px-6 sm:px-6 lg:px-8 py-4 sm:py-4 lg:py-4 min-h-12 sm:min-h-12 lg:min-h-14"
								>
									Start Here
								</Link>
								<Link
									href="/explore/project"
									className="btn btn-md sm:btn-md lg:btn-lg btn-secondary bg-primary/90 backdrop-blur-sm outline-none text-white font-normal hover:bg-primary transition-all duration-300 text-base sm:text-base lg:text-lg px-6 sm:px-6 lg:px-8 py-4 sm:py-4 lg:py-4 min-h-12 sm:min-h-12 lg:min-h-14"
								>
									Explore the Data
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Removing data summary arrow for now */}
			{/* <div className="relative mb-12 text-center">
				<Link
					href="#dataSummary"
					className="relative inline-block after:absolute after:content-[''] after:inset-[-40px] after:cursor-pointer"
				>
					<p className="text-primary text-xl font-medium">Start Here!</p>
					<div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-8 w-12 text-primary mx-auto"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
						</svg>
					</div>
				</Link>
			</div> */}
			<div id="dataSummary" className="z-content px-4 sm:px-6 lg:px-8 pb-12 -mt-10 sm:-mt-12 md:-mt-5">
				<div className="mb-12">
					<MainStats summaryItems={summaryItems} />
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
					{/* Map Section */}
					<div>
						<div className="mb-4 text-xl text-base-content">
							Showing all
							<span className="text-primary"> Projects</span>
						</div>
						<div className="aspect-video w-full rounded-lg overflow-hidden bg-base-200 shadow-sm">
							<Map
								locations={locations}
								id="samp_name"
								title="project_id"
								titleTable="project"
								table="sample"
								iconSize={16}
								legend={projectColors}
							/>
						</div>
					</div>

					{/* Assay Stats Section */}
					<div>
						<div className="mb-4 text-xl text-base-content">
							<span className="text-primary">Assays used Across ODE</span>
						</div>
						<AssayStats assays={uniqueAssays} />
					</div>
				</div>

				{/* Funding Institutes Section */}
				<div className="mt-24 lg:mt-32 mb-12 lg:mb-24">
					<h2 className="text-2xl lg:text-3xl text-primary mb-6 lg:mb-8 text-center">Supported By:</h2>

					<div className="max-w-4xl mx-auto text-lg text-main mb-8 lg:mb-16 text-center leading-tight">
						<p>
							NODE is a product of{" "}
							<Link
								href="https://www.aoml.noaa.gov/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								NOAA's Atlantic Oceanographic and Meteorological Laboratory
							</Link>{" "}
							in collaboration with the{" "}
							<Link
								href="https://www.northerngulfinstitute.org/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								Northern Gulf Institute
							</Link>{" "}
							at{" "}
							<Link
								href="https://www.msstate.edu/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								Mississippi State University
							</Link>{" "}
							and is supported by{" "}
							<Link
								href="https://oceanexplorer.noaa.gov/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								NOAA Ocean Exploration
							</Link>{" "}
							and{" "}
							<Link
								href="https://oceanexplorer.noaa.gov/technology/omics/noaa-omics.html"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								NOAA Omics
							</Link>{" "}
							projects NO_0062 and NO_0066.
						</p>
					</div>
					<div className="p-8 rounded-lg justify-center mx-auto max-w-fit mt-8 lg:-mt-4">
						<div className="flex flex-col lg:flex-row justify-center items-center gap-10 lg:gap-20">
							<div className="relative h-16 w-48 lg:h-24 lg:w-64">
								<Link href="https://oceanexplorer.noaa.gov/welcome.html" target="_blank" rel="noreferrer">
									<ThemeAwareLogo
										src="/images/noaa_exploration_logo_FINAL.svg"
										alt="National Oceanic and Atmospheric Administration Exploration Logo"
										fill={true}
										className="object-contain"
									/>
								</Link>
							</div>
							<div className="relative h-16 w-80 lg:h-24 lg:w-[26rem]">
								<Link href="https://www.northerngulfinstitute.org/" target="_blank" rel="noreferrer">
									<ThemeAwareLogo
										src="/images/ngi_msu_logo_FINAL.svg"
										alt="Mississippi State University, Northern Gulf Institute Logo"
										fill={true}
										className="object-contain"
									/>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
