import { ReactNode } from "react";

export default function ContentLayout({ children }: { children: ReactNode }) {
	return (
		<div className="w-[85%] sm:w-[80%] md:w-[75%] lg:w-[75%] xl:w-[80%] mx-auto mt-4 mb-4 grow flex flex-col">
			{children}
		</div>
	);
}
