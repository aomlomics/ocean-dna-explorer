"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";

export default function Page() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get("redirect_url");
	const decodedRedirectUrl = redirectUrl ? decodeURIComponent(redirectUrl) : null;
	const isSubmissionFlow = decodedRedirectUrl?.includes("/submit") || decodedRedirectUrl?.includes("/contribute");

	const cardVariantClass = isSubmissionFlow ? "ode-signin-card ode-signin-card--submission" : "ode-signin-card";

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-base-100 px-4">
			<SignIn
				appearance={{
					variables: isDark
						? {
								colorPrimary: "#7DBAE5",
								colorBackground: "#192136",
								colorText: "#E2E8F0",
								colorInputBackground: "#232942",
								colorInputText: "#E2E8F0"
							}
						: {
								colorPrimary: "#233D7F",
								colorBackground: "#eef2f6",
								colorText: "#233D7F",
								colorInputBackground: "#F4F3F2",
								colorInputText: "#233D7F"
							},
					options: {
						logoPlacement: "inside",
						logoImageUrl: "/images/light_mode_logo.svg"
					},
					elements: {
						card: `bg-base-200 shadow-2xl p-10 rounded-2xl border-4 ${cardVariantClass}`,
						headerTitle: "hidden",
						headerSubtitle: "hidden",
						formButtonPrimary: isDark
							? "bg-[#64ABDC] text-white hover:bg-[#4B95C3] font-semibold rounded-lg"
							: "bg-[#233D7F] text-white hover:bg-[#4B95C3] font-semibold rounded-lg",
						socialButtonsBlockButton: isDark
							? "bg-[#181c2a] text-[#E2E8F0] font-normal hover:bg-[#385396] rounded-lg"
							: "bg-[#E3E3E9] text-[#233D7F] font-normal hover:bg-[#DFDFE6] rounded-lg",
						formFieldInput: isDark
							? "bg-[#232942] text-[#E2E8F0] border border-[#7DBAE5] rounded-lg"
							: "bg-[#F4F3F2] text-[#233D7F] border border-[#233D7F] rounded-lg",
						dividerLine: isDark ? "bg-[#7DBAE5]" : "bg-[#233D7F]"
					}
				}}
				path="/sign-in"
				routing="path"
				signUpUrl="/sign-up"
			/>
			<button
				onClick={() => window.history.back()}
				className="bg-base-200 text-base-content hover:bg-base-300 font-normal rounded-lg text-lg px-6 py-3 mt-8 transition-colors duration-200"
			>
				Return to Previous Page
			</button>
		</div>
	);
}
