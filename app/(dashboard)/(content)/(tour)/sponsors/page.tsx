"use client";

import Image from "next/image";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";
import { motion } from "framer-motion";

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
			<motion.div
				className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-6 text-center"
				initial={{ opacity: 0, x: 120, y: 16 }}
				animate={{ opacity: 1, x: 0, y: 0 }}
				transition={{ duration: 2.1, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
			>
				<Image
					src="/images/ode_logo_clean.svg"
					alt="Ocean DNA Explorer logo"
					width={104}
					height={104}
					priority
					className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
				/>
				<h1 className="sponsors-title text-3xl font-semibold text-primary sm:text-4xl md:text-5xl">
					Thank you to our supporters.
				</h1>
				<p className="sponsors-subtitle max-w-2xl text-base text-base-content/75 sm:text-lg">
					Made possible by these organizations.
				</p>

				{/* Logo row: each logo gets its own float animation delay so they
				    bob gently out-of-phase, which feels more natural than a
				    perfectly synchronized motion. */}
				<div className="mt-8 flex w-full flex-wrap items-center justify-center gap-10 sm:gap-16">
					{SPONSORS.map((sponsor) => (
						<div
							key={sponsor.name}
							className={`${sponsor.wrapperClass} relative flex items-center justify-center ${
								sponsor.name.includes("Northern Gulf Institute")
									? "h-40 w-96 sm:h-48 sm:w-xl"
									: "h-28 w-64 sm:h-36 sm:w-96"
							}`}
						>
							{sponsor.name.includes("Northern Gulf Institute") ? (
								<ThemeAwareLogo
									src={sponsor.srcLight}
									alt={sponsor.name}
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
			</motion.div>
		</div>
	);
}
