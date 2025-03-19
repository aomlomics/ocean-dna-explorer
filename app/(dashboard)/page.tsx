import Carousel from "@/app/components/Carousel";
import Link from "next/link";
import DataSummary from "../components/DataSummary";
import ThemeAwareLogo from "../components/ThemeAwareLogo";
import { DeadValueEnum } from "@/types/enums";
import { prisma } from "../helpers/prisma";
import Map from "../components/map/Map";
import { randomColors } from "../helpers/utils";

export default async function Home() {
	const deadValues = Object.values(DeadValueEnum).filter((v) => !isNaN(Number(v))) as number[];

	const samples = await prisma.sample.findMany({
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

	const uniqueProjects = samples.reduce((acc, a) => {
		if (!acc.includes(a.project_id)) {
			acc.push(a.project_id);
		}

		return acc;
	}, [] as string[]);
	const colors = randomColors(uniqueProjects.length);
	const projectColors = {} as Record<string, string>;
	for (let i = 0; i < colors.length; i++) {
		projectColors[uniqueProjects[i]] = colors[i];
	}

	const locations = samples.map((samp) => ({ ...samp, color: projectColors[samp.project_id] }));

	return (
		<main className="flex flex-col grow bg-base-400 text-base-content">
			<div className="relative w-full h-screen max-h-[80vh] bg-black overflow-hidden z-content-overlay">
				<Carousel />
				{/* Gradient for left-to-right */}
				<div className="absolute inset-0 -right-[60%] bg-gradient-to-r from-base-100 via-base-100/30 via-[40%] to-transparent to-[100%]"></div>
				{/* Gradient for bottom */}
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-base-100/40 via-[50%] to-base-100"></div>
				{/* Updated hero content container */}
				<div className="absolute inset-0 flex items-center z-content">
					<div className="w-full px-4 sm:px-6 lg:px-8 max-w-[95%] mx-auto">
						<div className="max-w-4xl">
							<h1 className="text-[clamp(2.5rem,7.5vw,6.25rem)] font-light leading-none mb-1">
								<span className="block text-primary animate-slide-in">Welcome</span>
							</h1>

							<div className="text-base-content -mt-1">
								<span className="block text-[clamp(1.5rem,4.5vw,3.75rem)] font-light leading-tight mb-1">
									to the <span className="text-primary font-light">NOAA Ocean DNA Explorer</span>
								</span>

								<div className="text-[clamp(1rem,2.2vw,1.9rem)] leading-snug text-base-content max-w-3xl mb-8">
									<span className="block">
										a data sharing platform, search engine, and visualization and analysis tool for ocean environmental
										DNA data
									</span>
								</div>
							</div>

							<div className="flex flex-col items-start gap-4">
								<Link
									href="/explore"
									className="btn btn-lg btn-secondary bg-primary/90 backdrop-blur-sm outline-none text-white hover:bg-primary transition-all duration-300"
								>
									Explore Data
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="relative mb-12 text-center">
				<Link
					href="#dataSummary"
					className="relative inline-block after:absolute after:content-[''] after:inset-[-40px] after:cursor-pointer"
				>
					<p className="text-primary text-xl font-medium mb-2">Data Summary</p>
					<div className="animate-bounce">
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
			</div>
			<div id="dataSummary" className="z-content px-4 sm:px-6 lg:px-8 pb-12">
				<div className="mb-4 text-2xl text-base-content">
					Showing all
					<span className="text-primary"> Projects</span>
				</div>
				<div className="flex gap-8">
					<div className="h-[500px] w-1/2 rounded-lg overflow-hidden">
						<Map
							locations={locations}
							id="samp_name"
							title="project_id"
							table="project"
							iconSize={16}
							legend={projectColors}
						/>
					</div>
					<div className="w-1/2">
						<DataSummary />
					</div>
				</div>

				{/* Funding Institutes Section */}
				<div className="mt-32 mb-24">
					<h2 className="text-3xl text-primary mb-12 text-center">Supported By:</h2>

					<div className="max-w-4xl mx-auto text-lg text-main mb-16 text-center leading-tight">
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
					<div className="p-8 rounded-lg justify-center mx-auto max-w-fit">
						<div className="flex justify-center items-center gap-20">
							<div className="relative h-24 w-64">
								<Link href="https://oceanexplorer.noaa.gov/welcome.html" target="_blank" rel="noreferrer">
									<ThemeAwareLogo
										src="/images/noaa_exploration_logo_FINAL.svg"
										alt="National Oceanic and Atmospheric Administration Exploration Logo"
										fill={true}
										className="object-contain"
									/>
								</Link>
							</div>
							<div>
								<Link href="https://www.northerngulfinstitute.org/" target="_blank" rel="noreferrer">
									<ThemeAwareLogo
										src="/images/ngi_msu_logo_FINAL.svg"
										alt="Mississippi State University, Northern Gulf Institute Logo"
										width={500}
										height={300}
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
