import type { ReactNode } from "react";

//highlighted box for rules that break a query when ignored
//plain divs are used so the docs prose styles don't override the accent heading
export default function Callout({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="my-6 border-l-2 border-base-content/30 pl-4">
			<div className="font-semibold mb-1">{title}</div>
			<div className="space-y-2">{children}</div>
		</div>
	);
}
