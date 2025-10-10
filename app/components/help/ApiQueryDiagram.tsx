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
		[protocol, domain] = domain.split("://");
		protocol += "://";
	}

	return (
		<div className="my-10">
			<div className="bg-base-200 p-4 rounded-lg shadow-lg border border-base-content/10">
				{/* Full URL display */}
				<div className="bg-base-100 p-4 rounded-md font-mono text-sm mb-6 break-all shadow-inner">
					<span className="text-base-content/50">{protocol}</span>
					<span className="text-base-content/70">{domain}</span>
					<span className="text-white font-bold">{endpoint.value}</span>
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

				{/* Breakdown Section */}
				<div className="space-y-4 px-2">
					<div className="flex items-center space-x-4">
						<div className="flex-shrink-0 w-28">
							<div className="font-mono text-xs font-bold text-base-content/60 tracking-widest">ENDPOINT</div>
						</div>
						<div className="font-mono text-sm">
							<span className="text-white font-bold">{endpoint.value}</span>
							<span className="text-base-content/60 ml-4">{endpoint.label}</span>
						</div>
					</div>

					{parameters &&
						parameters.map((param, index) => (
							<div key={index} className="flex items-center space-x-4">
								<div className="flex-shrink-0 w-28">
									<div className="font-mono text-xs font-bold text-base-content/60 tracking-widest">
										PARAMETER
									</div>
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
