import Image from "next/image";
import { CSSProperties } from "react";

export default function ThemeAwareLogo({
	src,
	alt,
	className,
	sizes,
	style
}: {
	src: string;
	alt: string;
	className?: string;
	sizes: string;
	style?: CSSProperties;
}) {
	return (
		<Image
			src={src}
			alt={alt}
			fill
			sizes={sizes}
			style={style}
			className={`
        transition-all duration-200
        [html[data-theme='light']_&]:invert-[0.85]
        [html[data-theme='dark']_&]:invert-0
        ${className ?? ""}
      `}
		/>
	);
}
