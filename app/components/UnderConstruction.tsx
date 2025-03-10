import Image from "next/image";

interface UnderConstructionProps {
	message?: string;
}

export default function UnderConstruction({ message }: UnderConstructionProps) {
	const defaultMessage = "The dev team is working hard to bring you this feature. Please check back soon!";

	return (
		<div className="flex flex-col text-main">
			<section className="max-w-2xl mx-auto -mt-8 py-16">
				<div className="relative w-48 h-48 mx-auto">
					<Image
						src="/images/construction_octo.png"
						alt="Construction Octopus"
						fill
						className="object-contain"
						priority
					/>
				</div>
				<h1 className="text-primary font-bold text-6xl text-center -mt-14 mb-4">NODE is Under Construction</h1>
				<div className="bg-base-200 shadow-sm rounded-3xl p-8">
					<p className="text-main text-center mb-6">{message || defaultMessage}</p>
				</div>
			</section>
		</div>
	);
}
