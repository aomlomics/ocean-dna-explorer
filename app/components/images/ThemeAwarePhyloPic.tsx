import Image from "next/image";

//TODO: make sizes required
export default function ThemeAwarePhyloPic({
	src,
	alt,
	className,
	sizes,
	onLoad,
	onError,
	priority
}: {
	src: string;
	alt: string;
	className?: string;
	sizes?: string;
	onLoad?: () => void;
	onError?: () => void;
	priority?: boolean;
}) {
	return (
		<Image
			src={src}
			alt={alt}
			fill
			sizes={sizes}
			onLoad={onLoad}
			onError={onError}
			priority={priority}
			className={`
        transition-all duration-200
        [html[data-theme='light']_&]:filter-[invert(17%)_sepia(31%)_saturate(4408%)_hue-rotate(209deg)_brightness(93%)_contrast(84%)]
        [html[data-theme='dark']_&]:filter-[invert(75%)_sepia(6%)_saturate(7117%)_hue-rotate(175deg)_brightness(93%)_contrast(83%)]
        ${className ?? ""}
      `}
		/>
	);
}
