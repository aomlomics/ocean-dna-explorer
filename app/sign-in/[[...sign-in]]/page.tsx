"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function Page() {
	const searchParams = useSearchParams();
	const redirectUrl = searchParams?.get("redirect_url");
	const decodedRedirectUrl = redirectUrl ? decodeURIComponent(redirectUrl) : null;
	const isSubmissionFlow = decodedRedirectUrl?.includes("/submit") || decodedRedirectUrl?.includes("/contribute");
	const helperText = isSubmissionFlow
		? "Sign in to submit data. Contributor access can be requested on the Submit page."
		: "Need contributor access? Visit the Submit page after signing in.";

	// 1st case: Shown when you try to go to submit without being signed in
	// 2nd case: If they click the Sign In button
	const cardVariantClass = isSubmissionFlow ? "ode-signin-card ode-signin-card--submission" : "ode-signin-card";

	return (
		<div className="ode-signin-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base-200 [html[data-theme='dark']_&]:bg-base-300/50 px-4 py-16">
			{/* Radial gradient colour wash */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(100,171,220,0.18)_0%,transparent_42%),radial-gradient(circle_at_right,rgba(35,61,127,0.16)_0%,transparent_40%)]" />

			{/* Top wave — 300px tall SVG; proportionally scaled from 480px baseline. */}
			{/* <svg className="pointer-events-none absolute inset-x-0 top-0 w-full rotate-180 text-base-100" height="300" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
				<path fill="currentColor" d="M0,278 C240,300 480,300 720,285 C960,255 1200,255 1440,278 L1440,300 L0,300 Z" />
			</svg> */}

			{/* Bottom wave */}
			{/* <svg className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-base-100" height="300" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
				<path fill="currentColor" d="M0,278 C240,300 480,300 720,285 C960,255 1200,255 1440,278 L1440,300 L0,300 Z" />
			</svg> */}

			<div className="relative z-10 flex w-full max-w-xl flex-col items-center">
				<SignIn
					appearance={{
						variables: {
							colorPrimary: "var(--clerk-color-primary)",
							colorBackground: "var(--clerk-color-background)",
							colorForeground: "var(--clerk-color-foreground)"
						},
						options: {
							logoPlacement: "inside",
							logoImageUrl: "/images/node_logo_light_mode.svg",
							socialButtonsVariant: "blockButton"
						},
						elements: {
							rootBox: "w-full",
							cardBox: "w-full max-w-[560px]",
							card: `w-full border shadow-2xl rounded-3xl px-10 py-10 sm:px-12 ${cardVariantClass} border-primary/25 bg-white/95 backdrop-blur-md [html[data-theme='dark']_&]:border-[#4B95C3]/40 [html[data-theme='dark']_&]:bg-[#111A2D]/90`,
							logoImage:
								"mx-auto h-auto w-[360px] max-w-full [html[data-theme='dark']_&]:brightness-0 [html[data-theme='dark']_&]:invert",
							headerTitle:
								"text-center font-semibold text-[1.35rem] text-[#1F2F57] [html[data-theme='dark']_&]:text-[#E2E8F0]",
							headerSubtitle: "hidden",
							formButtonPrimary: "bg-primary text-white hover:bg-primary/80 font-semibold rounded-lg min-h-11",
							socialButtonsRoot: "w-full",
							socialButtons: "flex flex-row justify-center gap-2 w-full",
							socialButtonsBlockButton:
								"flex-1 bg-[#EEF2F7] text-[#233D7F] font-normal hover:bg-[#DFE7F1] rounded-lg border border-[#233D7F]/20 min-h-11 [html[data-theme='dark']_&]:bg-[#181f32] [html[data-theme='dark']_&]:text-[#E2E8F0] [html[data-theme='dark']_&]:hover:bg-[#233D7F]/50 [html[data-theme='dark']_&]:border-[#4B95C3]/40",
							socialButtonsBlockButtonText: "text-[#233D7F] [html[data-theme='dark']_&]:text-[#E2E8F0]",
							formFieldInput:
								"bg-white text-[#233D7F] border border-[#233D7F]/35 rounded-lg min-h-11 [html[data-theme='dark']_&]:bg-[#1E2A45] [html[data-theme='dark']_&]:text-[#E2E8F0] [html[data-theme='dark']_&]:border-[#4B95C3]/60",
							dividerLine: "bg-[#233D7F]/35 [html[data-theme='dark']_&]:bg-[#4B95C3]/75"
						}
					}}
					path="/sign-in"
					routing="path"
					signUpUrl="/sign-up"
				/>
				<p className="mt-5 max-w-md text-center text-base font-semibold tracking-tight leading-relaxed text-[#33446D] [html[data-theme='dark']_&]:text-[#D6E2F3]">
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
