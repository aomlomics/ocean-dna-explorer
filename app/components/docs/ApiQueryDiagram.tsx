import type { ReactNode } from "react";

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

	const allParts = [endpoint, ...(parameters || [])];

	return (
		<div className="my-6">
			<div className="w-fit max-w-3xl rounded-md bg-base-200/60 p-4">
				{/* Full URL display (shared between mobile and desktop) */}
				<div className="mb-4 break-all font-mono">
					<span className="text-base-content/50">{protocol}</span>
					<span className="text-base-content/70">{domain}</span>
					<span className={endpoint.colorClass}>{endpoint.value}</span>
					{parameters && parameters.length > 0 && (
						<>
							<span className="text-primary">?</span>
							{parameters.map((param, index) => (
								<span key={index}>
									<span className={param.colorClass}>{param.value}</span>
									{index < parameters.length - 1 && <span className="text-primary">&</span>}
								</span>
							))}
						</>
					)}
				</div>

				{/* Mobile View: Simplified Legend */}
				<div className="space-y-3 md:hidden">
					{allParts.map((part, index) => (
						<div key={index}>
							<div className={`break-all font-mono ${part.colorClass}`}>{part.value}</div>
							<div className="text-base-content/70">{part.label}</div>
						</div>
					))}
				</div>

				{/* Desktop View: Detailed Breakdown */}
				<div className="hidden space-y-2 md:block">
					<div className="flex items-baseline gap-4">
						<div className="w-24 shrink-0 text-base-content/60">Endpoint</div>
						<div className="font-mono">
							<span className={endpoint.colorClass}>{endpoint.value}</span>
							<span className="ml-4 text-base-content/70">{endpoint.label}</span>
						</div>
					</div>

					{parameters &&
						parameters.map((param, index) => (
							<div key={index} className="flex items-baseline gap-4">
								<div className="w-24 shrink-0 text-base-content/60">Parameter</div>
								<div className="break-all font-mono">
									<span className={param.colorClass}>{param.value}</span>
									<span className="ml-4 text-base-content/70">{param.label}</span>
								</div>
							</div>
						))}
				</div>
			</div>
			<div className="mt-3">{description}</div>
		</div>
	);
}
