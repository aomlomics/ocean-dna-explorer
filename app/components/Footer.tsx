import Link from "next/link";
import ThemeAwareLogo from "./images/ThemeAwareLogo";

export default function Footer() {
	return (
		<footer className="footer p-4 text-neutral-content mt-auto z-30 bg-base-100 border-t-4 border-primary flex flex-row items-center justify-between">
			<div className="text-left text-base-content text-ui flex flex-col gap-1">
				<p className="text-sm sm:text-base sm:leading-tight">Copyright © 2024 - All Rights Reserved.</p>
				<p className="text-sm sm:text-base leading-tight">
					<Link
						href="https://www.aoml.noaa.gov/"
						className="text-primary hover:underline break-words"
						target="_blank"
						rel="noreferrer"
					>
						<span className="hidden sm:inline">NOAA's Atlantic Oceanographic and Meteorological Laboratory</span>
						<span className="sm:hidden">NOAA AOML</span>
					</Link>
				</p>
				<p className="text-sm sm:text-base sm:leading-tight">
					<Link
						href="https://github.com/aomlomics/node/issues"
						className="text-primary hover:underline"
						target="_blank"
						rel="noreferrer"
					>
						Issues & Feature Requests
					</Link>
				</p>
			</div>

			<div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4">
				<div className="relative h-10 w-32 sm:h-16 sm:w-40">
					<Link
						href="https://oceanexplorer.noaa.gov/welcome.html"
						target="_blank"
						rel="noreferrer"
						className="relative block h-full"
					>
						<ThemeAwareLogo
							src="/images/noaa_exploration_logo_FINAL.svg"
							alt="NOAA Exploration Logo"
							fill={true}
							sizes="(max-width: 640px) 8rem, 10rem"
							style={{
								objectFit: "contain",
							}}
						/>
					</Link>
				</div>
				<div className="relative h-10 w-48 sm:h-16 sm:w-72 -right-2.5">
					<Link
						href="https://www.northerngulfinstitute.org/"
						target="_blank"
						rel="noreferrer"
						className="relative block h-full"
					>
						<ThemeAwareLogo
							src="/images/ngi_msu_logo_FINAL.svg"
							alt="MSU NGI Logo"
							fill={true}
							sizes="(max-width: 640px) 12rem, 18rem"
							style={{ objectFit: "contain" }}
						/>
					</Link>
				</div>
			</div>
		</footer>
	);
}
