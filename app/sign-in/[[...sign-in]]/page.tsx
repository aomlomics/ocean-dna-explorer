"use client";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Page() {
	const router = useRouter();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-base-100 gap-4">
			<SignIn
				appearance={{
					elements: {
						formButtonPrimary: "text-primary hover:bg-primary/80",
						card: "bg-base-200 shadow-sm p-8",
						headerTitle: "text-primary text-3xl font-semibold",
						headerSubtitle: "text-primary font-normal",
						socialButtonsBlockButton: "bg-base-300 text-base-content font-normal hover:bg-base-400",
						formFieldInput: "bg-base-100 text-base-content",
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
