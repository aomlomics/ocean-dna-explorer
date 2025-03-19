import { ReactNode } from "react";

export default function ContentLayout({ children }: { children: ReactNode }) {
	return <div className="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[75%] xl:w-[calc(100%-600px)] mx-auto mt-4 mb-4">{children}</div>;
}
