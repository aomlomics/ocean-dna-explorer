"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";

export default function Page() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const logoImageUrl = isDark
		? "/images/node_logo_dark_mode.svg"
		: "/images/node_logo_light_mode.svg";

	const searchParams = useSearchParams();
	const redirectUrl = searchParams?.get("redirect_url");
	const decodedRedirectUrl = redirectUrl ? decodeURIComponent(redirectUrl) : null;
	const isSubmissionFlow = decodedRedirectUrl?.includes("/submit") || decodedRedirectUrl?.includes("/contribute");
	const helperText = isSubmissionFlow
		? "Sign in to submit data. Contributor access can be requested on the Submit page."
		: "Need contributor access? Visit the Submit page after signing in.";
{/* 1st case: Shown when you try to go to submit without being signed in */}
{/* 2nd case: If they click the Sign In button */}
	const cardVariantClass = isSubmissionFlow ? "ode-signin-card ode-signin-card--submission" : "ode-signin-card";

	return (
		<div className="ode-signin-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base-200 [html[data-theme='dark']_&]:bg-base-300/50 px-4 py-16">
			{/* Radial gradient colour wash */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(100,171,220,0.18)_0%,transparent_42%),radial-gradient(circle_at_right,rgba(35,61,127,0.16)_0%,transparent_40%)]" />

			{/* Top wave — 300px tall SVG; proportionally scaled from 480px baseline.
			<svg className="pointer-events-none absolute inset-x-0 top-0 w-full rotate-180 text-base-100" height="300" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
				<path fill="currentColor" d="M0,278 C240,300 480,300 720,285 C960,255 1200,255 1440,278 L1440,300 L0,300 Z" />
			</svg>

			{/* Bottom wave */}
			{/* <svg className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-base-100" height="300" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
				<path fill="currentColor" d="M0,278 C240,300 480,300 720,285 C960,255 1200,255 1440,278 L1440,300 L0,300 Z" />
			</svg> */}

			<div className="relative z-10 flex w-full max-w-xl flex-col items-center">
				<SignIn
					appearance={{
							variables: isDark
							? {
									colorPrimary: "#64ABDC",
									colorBackground: "#121A2E",
									colorText: "#E2E8F0",
									colorInputBackground: "#1E2A45",
									colorInputText: "#E2E8F0"
								}
							: {
									colorPrimary: "#233D7F",
									colorBackground: "#F7FAFC",
									colorText: "#1F2F57",
									colorInputBackground: "#FFFFFF",
									colorInputText: "#233D7F"
								},
					options: {
						logoPlacement: "inside",
						logoImageUrl,
						socialButtonsVariant: "blockButton"
					},
						elements: {
							card: `w-full border shadow-2xl rounded-3xl px-8 py-9 sm:px-10 ${cardVariantClass} ${isDark ? "border-[#4B95C3]/40 bg-[#111A2D]/90 backdrop-blur-md" : "border-[#233D7F]/25 bg-white/95 backdrop-blur-md"}`,
							logoImage: "mx-auto h-auto w-[330px] max-w-full",
							headerTitle: `text-center font-normal ${isDark ? "text-[#E2E8F0]" : "text-[#1F2F57]"}`,
						headerSubtitle: "hidden",
						formButtonPrimary: isDark
								? "bg-[#64ABDC] text-white hover:bg-[#4B95C3] font-semibold rounded-lg"
								: "bg-[#233D7F] text-white hover:bg-[#1E346B] font-semibold rounded-lg",
							socialButtonsRoot: "w-full",
						socialButtons: "flex flex-row justify-center gap-2 w-full",
						socialButtonsBlockButton: isDark
								? "flex-1 bg-[#181f32] text-[#E2E8F0] font-normal hover:bg-[#233D7F]/50 rounded-lg border border-[#4B95C3]/40"
								: "flex-1 bg-[#EEF2F7] text-[#233D7F] font-normal hover:bg-[#DFE7F1] rounded-lg border border-[#233D7F]/20",
						socialButtonsBlockButtonText: isDark ? "text-[#E2E8F0]" : "text-[#233D7F]",
							formFieldInput: isDark
								? "bg-[#1E2A45] text-[#E2E8F0] border border-[#4B95C3]/60 rounded-lg"
								: "bg-[#FFFFFF] text-[#233D7F] border border-[#233D7F]/35 rounded-lg",
							dividerLine: isDark ? "bg-[#4B95C3]/75" : "bg-[#233D7F]/35"
						}
					}}
					path="/sign-in"
					routing="path"
					signUpUrl="/sign-up"
				/>
				<p
					className={`mt-5 max-w-md text-center text-base font-semibold tracking-tight leading-relaxed ${
						isDark ? "text-[#D6E2F3]" : "text-[#33446D]"
					}`}
				>
					{helperText}
				</p>
			</div>
			<button
				onClick={() => window.history.back()}
				className="relative z-10 mt-8 flex items-center gap-2 rounded-lg bg-base-100/80 backdrop-blur-sm px-6 py-3 text-base font-semibold tracking-tight text-base-content transition-colors duration-200 hover:bg-base-300"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className="h-5 w-5"
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M17 10a.75.75 0 0 1-.75.75H5.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L5.56 9.25h10.69A.75.75 0 0 1 17 10Z"
						clipRule="evenodd"
					/>
				</svg>
				Return to Previous Page
			</button>
		</div>
	);
}
