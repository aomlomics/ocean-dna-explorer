import type { ReactNode } from "react";

//summary block shown above every query option, so each one is described the same way
export default function OptionSummary({
	syntax,
	worksOn,
	rules
}: {
	syntax: string;
	worksOn: ReactNode;
	rules?: ReactNode;
}) {
	return (
		<div className="mb-5 rounded-md border border-base-content/10 bg-base-200/40 p-4 space-y-2">
			<div className="font-mono text-sm break-all whitespace-pre-line">{syntax}</div>
			<div className="text-sm">
				<span className="font-semibold">Works on:</span> {worksOn}
			</div>
			{rules ? (
				<div className="text-sm">
					<span className="font-semibold">Rules:</span> {rules}
				</div>
			) : null}
		</div>
	);
}
