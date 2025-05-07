"use client";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { UserButton } from "@clerk/nextjs";

export default function Page() {
	const router = useRouter();
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-base-100 gap-4">
			<SignIn
				appearance={{
					baseTheme: isDark ? dark : undefined,
					elements: {
						card: isDark
							? "bg-[#181c2a] text-[#e2e8f0] shadow-lg p-8"
							: "bg-[#f4f3f2] text-[#2d3748] shadow-lg p-8",
						headerTitle: isDark
							? "text-[#64abdc] text-3xl font-semibold"
							: "text-[#233d7f] text-3xl font-semibold",
						headerSubtitle: isDark
							? "text-[#a0aec0] font-normal"
							: "text-[#4a5568] font-normal",
						formButtonPrimary: isDark
							? "bg-[#233d7f] text-white hover:bg-[#385396]"
							: "bg-[#233d7f] text-white hover:bg-[#4b95c3]",
						socialButtonsBlockButton: isDark
							? "bg-[#232942] text-[#e2e8f0] font-normal hover:bg-[#385396]"
							: "bg-[#e3e3e9] text-[#2d3748] font-normal hover:bg-[#dfdfe6]",
						formFieldInput: isDark
							? "bg-[#181c2a] text-[#e2e8f0]"
							: "bg-[#f4f3f2] text-[#2d3748]",
						dividerLine: isDark ? "bg-green" : "bg-red",
						logoImage: {
							width: "1000px",
							height: "40px"
						},
						userButtonPopoverActionButton: isDark
							? "bg-[#181c2a] text-[#e2e8f0] hover:bg-[#232942]"
							: "bg-[#f4f3f2] text-[#2d3748] hover:bg-[#e3e3e9]"
					}
				}}
				path="/sign-in"
				routing="path"
				signUpUrl="/sign-up"
			/>
			<div className="pt-8"></div>
			<button
				onClick={() => router.back()}
				className="btn bg-base-200 shadow-sm text-primary font-normal hover:bg-base-300"
			>
				Return to Previous Page
			</button>
		</div>
	);
}
