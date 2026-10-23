import Image from "next/image";
import { PhotoIcon } from "@/app/components/icons";

/**
 * Project-header photo button; hover/focus opens a full-image preview.
 */
export default function ProjectCoverPhotoPreview({ src, title }: { src: string; title: string }) {
	return (
		<div className="tooltip tooltip-bottom tooltip-end relative z-tooltip">
			<div className="tooltip-content z-tooltip w-[min(94vw,48rem)] max-w-none rounded-xl border border-base-content/20 bg-base-200 p-3 text-base-content shadow-xl">
				<Image
					src={src}
					alt=""
					width={1920}
					height={1080}
					className="max-h-[min(80vh,1000px)] h-auto w-auto max-w-full rounded-md object-contain"
				/>
			</div>
			<button
				type="button"
				className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-base-100/80 border border-base-300/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-base-100 hover:shadow-lg transition-shadow"
				aria-label={`Show full project photo for ${title}`}
			>
				<PhotoIcon />
			</button>
		</div>
	);
}
