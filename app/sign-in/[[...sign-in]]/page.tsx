"use client";
import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Page() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const logoImageUrl = isDark
		? "/images/node_logo_dark_mode.svg"
		: "/images/node_logo_light_mode.svg";

	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get("redirect_url");
	const decodedRedirectUrl = redirectUrl ? decodeURIComponent(redirectUrl) : null;
	const isSubmissionFlow =
		decodedRedirectUrl?.includes("/submit") || decodedRedirectUrl?.includes("/contribute");
	const helperText = isSubmissionFlow
		? "Signing in is required to continue data submission."
		: "Signing in is required for data submission.";

	const cardVariantClass = isSubmissionFlow
		? "ode-signin-card ode-signin-card--submission"
		: "ode-signin-card";

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base-100 px-4 py-10">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(100,171,220,0.14)_0%,transparent_42%),radial-gradient(circle_at_right,rgba(35,61,127,0.12)_0%,transparent_40%)]" />
			<div className="relative z-10 flex w-full max-w-xl flex-col items-center">
				<SignIn
					appearance={{
						baseTheme: isDark ? dark : undefined,
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
						layout: {
							logoPlacement: "inside",
							logoImageUrl
						},
						elements: {
							card: `w-full border shadow-2xl rounded-3xl px-8 py-9 sm:px-10 ${cardVariantClass} ${isDark ? "border-[#4B95C3]/40 bg-[#111A2D]/90 backdrop-blur-md" : "border-[#233D7F]/25 bg-white/95 backdrop-blur-md"}`,
							logoImage: "mx-auto h-auto w-[330px] max-w-full",
							headerTitle: `text-center text-sm font-semibold tracking-tight ${isDark ? "text-[#E2E8F0]" : "text-[#1F2F57]"}`,
							headerSubtitle: "hidden",
							formButtonPrimary: isDark
								? "bg-[#64ABDC] text-white hover:bg-[#4B95C3] font-semibold rounded-lg"
								: "bg-[#233D7F] text-white hover:bg-[#1E346B] font-semibold rounded-lg",
							socialButtonsBlockButton: isDark
								? "bg-[#181f32] text-[#E2E8F0] font-normal hover:bg-[#233D7F]/50 rounded-lg border border-[#4B95C3]/40"
								: "bg-[#EEF2F7] text-[#233D7F] font-normal hover:bg-[#DFE7F1] rounded-lg border border-[#233D7F]/20",
							formFieldInput: isDark
								? "bg-[#1E2A45] text-[#E2E8F0] border border-[#4B95C3]/60 rounded-lg"
								: "bg-[#FFFFFF] text-[#233D7F] border border-[#233D7F]/35 rounded-lg",
							dividerLine: isDark ? "bg-[#4B95C3]/75" : "bg-[#233D7F]/35"
						}
					}}
					path="/sign-in"
					routing="path"
					signUpUrl="/sign-up"
					localization={{
						signIn: {
							start: {
								title: "Sign In",
								titleCombined: "Sign In"
							}
						}
					}}
				/>
				<p
					className={`mt-5 max-w-md text-center text-sm font-semibold tracking-tight leading-relaxed ${
						isDark ? "text-[#D6E2F3]" : "text-[#33446D]"
					}`}
				>
					{helperText}
					{" "}
					<Link
						href="/contribute"
						className={`underline underline-offset-2 transition-colors ${
							isDark ? "text-[#9FCDF0] hover:text-[#C4E2F8]" : "text-[#233D7F] hover:text-[#1E346B]"
						}`}
					>
						Request contributor access
					</Link>
					.
				</p>
			</div>
			<button
				onClick={() => window.history.back()}
				className="relative z-10 mt-8 flex items-center gap-2 rounded-lg bg-base-200 px-6 py-3 text-sm font-semibold tracking-tight text-base-content transition-colors duration-200 hover:bg-base-300"
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
