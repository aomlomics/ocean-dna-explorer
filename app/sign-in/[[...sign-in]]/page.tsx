"use client";
import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import Image from "next/image";

export default function Page() {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-base-100">
			<Image
				src="/icon.png"
				alt="Logo"
				width={120}
				height={120}
				className="mb-6"
			/>
			<SignIn
				appearance={{
					baseTheme: isDark ? dark : undefined,
					variables: isDark
						? {
							colorPrimary: "#7DBAE5",
							colorBackground: "#232942",
							colorText: "#E2E8F0",
							colorInputBackground: "#232942",
							colorInputText: "#E2E8F0"
						}
						: {
							colorPrimary: "#233D7F",
							colorBackground: "#F4F3F2",
							colorText: "#233D7F",
							colorInputBackground: "#F4F3F2",
							colorInputText: "#233D7F",
						},
					elements: {
						card: "shadow-2xl p-10 rounded-2xl border-4",
						headerTitle: isDark
							? "text-[#7DBAE5] text-3xl font-bold mb-4 text-center"
							: "text-[#233D7F] text-3xl font-bold mb-4 text-center",
						headerSubtitle: isDark
							? "text-[#A0AEC0] font-normal text-center"
							: "text-[#4A5568] font-normal text-center",
						formButtonPrimary: isDark
							? "bg-[#64ABDC] text-white hover:bg-[#4B95C3] font-semibold rounded-lg"
							: "bg-[#233D7F] text-white hover:bg-[#4B95C3] font-semibold rounded-lg",
						socialButtonsBlockButton: isDark
							? "bg-[#181c2a] text-[#E2E8F0] font-normal hover:bg-[#385396] rounded-lg"
							: "bg-[#E3E3E9] text-[#233D7F] font-normal hover:bg-[#DFDFE6] rounded-lg",
						formFieldInput: isDark
							? "bg-[#232942] text-[#E2E8F0] border border-[#7DBAE5] rounded-lg"
							: "bg-[#F4F3F2] text-[#233D7F] border border-[#233D7F] rounded-lg",
						dividerLine: isDark ? "bg-[#7DBAE5]" : "bg-[#233D7F]",
						logoImage: {
							width: "1000px",
							height: "40px"
						}
					}
				}}
				path="/sign-in"
				routing="path"
				signUpUrl="/sign-up"
			/>
			<button
				onClick={() => window.history.back()}
				className={
					`${isDark
						? "bg-[#64ABDC] text-white hover:bg-[#4B95C3]"
						: "bg-[#233D7F] text-white hover:bg-[#4B95C3]"}
					font-semibold rounded-lg text-lg px-6 py-3 mt-8 transition-colors duration-200`
				}
			>
				Return to Previous Page
			</button>
		</div>
	);
}
