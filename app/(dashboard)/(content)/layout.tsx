import { ReactNode } from "react";

export default function ContentLayout({ children }: { children: ReactNode }) {
	return (
		<main
			id="main-content"
			className="my-4 flex w-[85%] min-h-0 grow flex-col mx-auto sm:w-[80%] md:w-[75%] lg:w-[75%] xl:w-[80%] has-[.tour-layout-root]:m-0 has-[.tour-layout-root]:w-full has-[.tour-layout-root]:min-h-dvh"
		>
			{children}
		</main>
	);
}
