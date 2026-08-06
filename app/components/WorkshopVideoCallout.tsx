import Link from "next/link";

export const WORKSHOP_PLAYLIST_HREF = "https://www.youtube.com/playlist?list=PLS6jqgZoUzto";
export const OBON_HREF = "https://obon-ocean.org/";
export const WORKSHOP_TITLE = "FAIR eDNA Workshop: Mobilizing Data from Standards to Sharing";
export const ODE_WORKSHOP_TITLE = "Learn how to create your own eDNA datasets";

type WorkshopVideoCalloutProps = {
	compact?: boolean;
	className?: string;
};

export default function WorkshopVideoCallout({ compact = false, className = "" }: WorkshopVideoCalloutProps) {
	if (compact) {
		return (
			<div className={`rounded-lg bg-base-200/50 p-4 ${className}`}>
				<div className="grid grid-cols-[auto_1fr] items-center gap-3">
					<Link href={WORKSHOP_PLAYLIST_HREF} target="_blank" rel="noreferrer" aria-label="Open playlist on YouTube">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="size-12 shrink-0 text-primary transition-colors hover:text-primary/85"
						>
							<path d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.39.58A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.39-.58a3 3 0 0 0 2.11-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
						</svg>
					</Link>
					<p className="mb-0 text-sm leading-relaxed text-base-content/80">
						Learn more using the tutorial series from the {WORKSHOP_TITLE}. Produced by{" "}
						<Link href={OBON_HREF} target="_blank" rel="noreferrer" className="link link-primary">
							OBON
						</Link>
						.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`w-full max-w-3xl rounded-xl bg-base-200/40 p-4 ${className}`}>
			<div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[0.3fr_0.7fr] sm:gap-4">
				<div className="flex justify-center">
					<Link href={WORKSHOP_PLAYLIST_HREF} target="_blank" rel="noreferrer" aria-label="Open playlist on YouTube">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="size-20 shrink-0 text-primary transition-colors hover:text-primary/85 sm:size-24"
						>
							<path d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.39.58A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.12C4.5 20.5 12 20.5 12 20.5s7.5 0 9.39-.58a3 3 0 0 0 2.11-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
						</svg>
					</Link>
				</div>
				<div>
					<h3 className="text-lg font-semibold leading-snug text-base-content">{ODE_WORKSHOP_TITLE}</h3>
					<p className="mb-2 text-sm leading-relaxed text-base-content/75">
						{WORKSHOP_TITLE} by{" "}
						<Link href={OBON_HREF} target="_blank" rel="noreferrer" className="link link-primary">
							OBON
						</Link>
					</p>
					<ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-base-content/80">
						<li>Use the FAIR eDNA data standard</li>
						<li>Build ODE-ready datasets</li>
						<li>Publish to other repositories such as OBIS, GBIF, NCBI, and more</li>
					</ul>
					<Link href={WORKSHOP_PLAYLIST_HREF} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
						Watch on YouTube
					</Link>
				</div>
			</div>
		</div>
	);
}
