import UnderConstruction from "@/app/components/UnderConstruction";
import Link from "next/link";
// import TourmalineForm from "@/app/components/tourmalineForm/TourmalineForm";

export default function Tourmaline() {
	return (
		<div className="py-4 flex flex-col items-center z-30 flex-1">
			<div className="w-1/2 max-w-4xl bg-base-200 rounded-3xl mb-4">
				<Link
					href={"https://github.com/aomlomics/tourmaline"}
					className="relative h-40 w-full flex items-center justify-center"
				>
					<div className="text-center">
						<h1 className="text-secondary font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
							Tourmaline
						</h1>
						<p className="text-primary font-bold text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-3xl">
							Amplicon Sequence Processing Workflow
						</p>
						<p className="text-secondary font-bold text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg">
							Click here to go to the official GitHub page
						</p>
					</div>
				</Link>
			</div>

			<div className="mb-4 flex justify-center z-30 bg-base-200 rounded-3xl p-2 w-full max-w-5xl">
				{/* <TourmalineForm /> */}
				<UnderConstruction />
			</div>
		</div>
	);
}
