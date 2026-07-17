import Link from "next/link";

export const WORKSHOP_PLAYLIST_HREF = "https://www.youtube.com/playlist?list=PLS6jqgZoUzto";
export const OBON_HREF = "https://obon-ocean.org/";
export const WORKSHOP_TITLE = "FAIR eDNA Workshop: Mobilizing Data from Standards to Sharing";

type WorkshopVideoCalloutProps = {
	compact?: boolean;
	className?: string;
};

export default function WorkshopVideoCallout({ compact = false, className = "" }: WorkshopVideoCalloutProps) {
	if (compact) {
		return (
			<div className={`rounded-lg bg-base-200/50 p-4 ${className}`}>
				<p className="mb-0 text-sm text-base-content/80">
					<span className="font-medium text-base-content">Video tutorials:</span> The{" "}
					<Link
						href={WORKSHOP_PLAYLIST_HREF}
						target="_blank"
						rel="noreferrer"
						className="link link-primary font-medium"
					>
						{WORKSHOP_TITLE}
					</Link>{" "}
					series demos these tools and walks through the FAIR eDNA standard and filling in your metadata templates.
					Produced by{" "}
					<Link href={OBON_HREF} target="_blank" rel="noreferrer" className="link link-primary">
						OBON
					</Link>
					.
				</p>
			</div>
		);
	}

	return (
		<div className={`w-full max-w-3xl rounded-xl bg-base-200/40 p-3 sm:p-4 ${className}`}>
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
					<h3 className="text-base font-semibold text-base-content sm:text-lg">{WORKSHOP_TITLE}</h3>
					<p className="mb-1.5 text-xs text-base-content/70 sm:text-sm">
						From{" "}
						<Link href={OBON_HREF} target="_blank" rel="noreferrer" className="text-primary hover:underline">
							OBON
						</Link>
					</p>
					<ul className="mb-3 list-disc space-y-1 pl-5 text-xs leading-relaxed text-base-content/80 sm:text-sm">
						<li>The FAIR eDNA data standard</li>
						<li>Walking through the metadata templates</li>
						<li>Open source software tools built for FAIR eDNA</li>
						<li>Publication and data submission workflows</li>
					</ul>
					<Link href={WORKSHOP_PLAYLIST_HREF} target="_blank" rel="noreferrer" className="btn btn-primary btn-xs sm:btn-sm">
						Watch on YouTube
					</Link>
				</div>
			</div>
		</div>
	);
}
