import Link from "next/link";
import ThemeAwareLogo from "./images/ThemeAwareLogo";

export default function Footer() {
	return (
		<footer className="footer pl-1 text-neutral-content mt-auto z-30 bg-base-100 border-t-4 border-primary flex items-stretch">
			<div className="text-left py-2 text-base-content text-ui">
				<p className="text-xs sm:text-sm lg:text-md -mb-2.5">Copyright © 2024 - All Rights Reserved.</p>
				<p className="text-xs sm:text-sm lg:text-md -mb-2.5 leading-none">
					<Link
						href="https://www.aoml.noaa.gov/"
						className="text-primary hover:underline break-words"
						target="_blank"
						rel="noreferrer"
					>
						NOAA's Atlantic Oceanographic and Meteorological Laboratory
					</Link>
				</p>
				<p className="text-xs sm:text-sm lg:text-md">
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

			<div className="flex items-stretch bg-base-100 justify-end ml-auto">
				<div className="rounded-l-sm flex items-center px-6 h-full">
					<div className="relative h-12 w-32 self-center">
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
								sizes="100%"
								style={{
									objectFit: "contain",
									marginTop: "3px"
								}}
							/>
						</Link>
					</div>
					<div className="relative h-12 w-64 ml-10 self-center mt-2">
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
								sizes="100%"
								style={{ objectFit: "contain" }}
							/>
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
