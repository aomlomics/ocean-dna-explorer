"use client";

import Image from "next/image";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";

// Static list for now; add more sponsors here later.
// Only logos and labels live in this file — all animation is in globals.css.
const SPONSORS = [
	{
		name: "NOAA Ocean Exploration",
		// NOAA OAR logos ship as separate light/dark files, so we render
		// both and let the theme CSS toggle which one is visible.
		srcLight: "/images/noaa_oar_logo.svg",
		srcDark: "/images/noaa_oar_logo_dark.svg",
		wrapperClass: "sponsors-logo sponsors-logo-delay-1"
	},
	{
		name: "Mississippi State University — Northern Gulf Institute",
		// The NGI logo has a single asset that works on both themes.
		srcLight: "/images/ngi_msu_logo_FINAL.svg",
		srcDark: "/images/ngi_msu_logo_FINAL.svg",
		wrapperClass: "sponsors-logo sponsors-logo-delay-2"
	}
];

export default function SponsorsPage() {
	return (
		<div className="tour-motion-bg relative isolate flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-base-200 [html[data-theme='dark']_&]:bg-base-300/50 px-6">

			<div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-6 text-center">
				<h1 className="sponsors-title text-3xl font-semibold text-primary sm:text-4xl md:text-5xl">
					Thank You to Our Supporting Institutes
				</h1>
				<p className="sponsors-subtitle max-w-2xl text-base text-base-content/75 sm:text-lg">
					The Ocean DNA Explorer is made possible by these institutes.
				</p>

				{/* Logo row: each logo gets its own float animation delay so they
				    bob gently out-of-phase, which feels more natural than a
				    perfectly synchronized motion. */}
				<div className="mt-8 flex w-full flex-wrap items-center justify-center gap-10 sm:gap-16">
					{SPONSORS.map((sponsor) => (
						<div
							key={sponsor.name}
							className={`${sponsor.wrapperClass} relative flex h-28 w-64 items-center justify-center sm:h-36 sm:w-96`}
						>
							{sponsor.name.includes("Northern Gulf Institute") ? (
								<ThemeAwareLogo
									src={sponsor.srcLight}
									alt={sponsor.name}
									fill
									sizes="(max-width: 640px) 16rem, 24rem"
									className="object-contain"
								/>
							) : (
								<>
									<Image
										src={sponsor.srcLight}
										alt={sponsor.name}
										fill
										sizes="(max-width: 640px) 16rem, 24rem"
										className="object-contain [html[data-theme='dark']_&]:hidden"
									/>
									<Image
										src={sponsor.srcDark}
										alt={sponsor.name}
										fill
										sizes="(max-width: 640px) 16rem, 24rem"
										className="hidden object-contain [html[data-theme='dark']_&]:block"
									/>
								</>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
