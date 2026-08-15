import { ReactNode } from "react";

type QueryPart = {
	value: string;
	label: string;
	colorClass: string; // e.g., "text-primary", "text-accent"
};

export default function ApiQueryDiagram({
	baseUrl,
	endpoint,
	parameters,
	description
}: {
	baseUrl: string;
	endpoint: QueryPart;
	parameters?: QueryPart[];
	description: ReactNode;
}) {
	let protocol = "";
	let domain = baseUrl;
	if (domain.includes("://")) {
		[protocol, domain] = domain.split("://") as [string, string];
		protocol += "://";
	}

	const colorMap: { [key: string]: string } = {
		"text-primary": "bg-primary",
		"text-secondary": "bg-secondary",
		"text-accent": "bg-accent",
		"text-info": "bg-info",
		"text-success": "bg-success",
		"text-warning": "bg-warning",
		"text-error": "bg-error"
	};

	const allParts = [endpoint, ...(parameters || [])];

	return (
		<div className="my-10">
			<div className="bg-base-200/30 p-4 rounded-lg border border-base-content/5">
				{/* Full URL display (shared between mobile and desktop) */}
				<div className="bg-base-200/50 p-4 rounded-md font-mono text-xs sm:text-sm mb-6 break-all overflow-x-auto">
					<span className="text-base-content/50">{protocol}</span>
					<span className="text-base-content/70">{domain}</span>
					<span className={`font-bold ${endpoint.colorClass}`}>{endpoint.value}</span>
					{parameters && parameters.length > 0 && (
						<>
							<span className="text-primary font-bold">?</span>
							{parameters.map((param, index) => (
								<span key={index}>
									<span className={`font-bold ${param.colorClass}`}>{param.value}</span>
									{index < parameters.length - 1 && <span className="text-primary font-bold">&</span>}
								</span>
							))}
						</>
					)}
				</div>

				{/* Mobile View: Simplified Legend */}
				<div className="md:hidden space-y-4 px-2">
					{allParts.map((part, index) => (
						<div key={index} className="flex items-start space-x-3">
							<div
								className={`w-3 h-3 mt-1.5 rounded-full shrink-0 ${colorMap[part.colorClass] || "bg-base-content"}`}
							></div>
							<div>
								<div className={`font-mono text-sm break-all font-bold ${part.colorClass}`}>{part.value}</div>
								<div className="text-base-content/70 text-sm">{part.label}</div>
							</div>
						</div>
					))}
				</div>

				{/* Desktop View: Detailed Breakdown */}
				<div className="hidden md:block space-y-4 px-2">
					<div className="flex items-center space-x-4">
						<div className="shrink-0 w-28">
							<div className="font-mono text-xs font-bold text-base-content/60 tracking-widest">ENDPOINT</div>
						</div>
						<div className="font-mono text-sm">
							<span className={`font-bold ${endpoint.colorClass}`}>{endpoint.value}</span>
							<span className="text-base-content/60 ml-4">{endpoint.label}</span>
						</div>
					</div>

					{parameters &&
						parameters.map((param, index) => (
							<div key={index} className="flex items-center space-x-4">
								<div className="shrink-0 w-28">
									<div className="font-mono text-xs font-bold text-base-content/60 tracking-widest">PARAMETER</div>
								</div>
								<div className="font-mono text-sm break-all">
									<span className={`font-bold ${param.colorClass}`}>{param.value}</span>
									<span className="text-base-content/60 ml-4">{param.label}</span>
								</div>
							</div>
						))}
				</div>
			</div>
			<div className="mt-4 text-base-content/80 px-2">{description}</div>
		</div>
	);
}
