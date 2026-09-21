import type { ReactNode } from "react";

//highlighted box for rules that break a query when ignored
//plain divs are used so the docs prose styles don't override the accent heading
export default function Callout({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="my-6 px-4 py-3 bg-base-200/50 border-l-4 border-accent rounded-md shadow-sm">
			<div className="font-semibold mb-2 text-accent">{title}</div>
			<div className="text-sm space-y-2">{children}</div>
		</div>
	);
}
