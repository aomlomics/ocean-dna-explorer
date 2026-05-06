import { ReactNode } from "react";

export default function ContentLayout({ children }: { children: ReactNode }) {
	return (
		<div className="mt-4 mb-4 flex w-[85%] max-w-[1536px] grow flex-col mx-auto sm:w-[80%] md:w-[75%] lg:w-[75%] xl:w-[80%] has-[.tour-layout-root]:m-0 has-[.tour-layout-root]:min-h-dvh">
			{children}
		</div>
	);
}
