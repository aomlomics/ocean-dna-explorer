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
		<div className="mb-5 w-fit max-w-3xl rounded-md bg-base-200/60 px-4 py-3 space-y-1">
			<div className="font-mono break-all whitespace-pre-line">{syntax}</div>
			<div>
				<span className="font-semibold">Works on:</span> {worksOn}
			</div>
			{rules ? (
				<div>
					<span className="font-semibold">Rules:</span> {rules}
				</div>
			) : null}
		</div>
	);
}
