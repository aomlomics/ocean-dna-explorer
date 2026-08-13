import Image from "next/image";
import { CSSProperties } from "react";

export default function NodeLogo({
	alt,
	fill,
	style,
	sizes,
	className
}: {
	alt: string;
	fill: boolean;
	style: CSSProperties;
	sizes: string;
	className?: string;
}) {
	return (
		<div className="relative w-full h-full">
			<Image
				alt={alt}
				fill={fill}
				style={style}
				sizes={sizes}
				src="/images/node_logo_dark_mode.svg"
				className={`
					absolute inset-0
					transition-opacity duration-200
					[html[data-theme='dark']_&]:opacity-100
					[html[data-theme='light']_&]:opacity-0
					${className ?? ""}
				`}
			/>
			<Image
				alt={alt}
				fill={fill}
				style={style}
				sizes={sizes}
				src="/images/node_logo_light_mode.svg"
				className={`
					absolute inset-0
					transition-opacity duration-200
					[html[data-theme='dark']_&]:opacity-0
					[html[data-theme='light']_&]:opacity-100
					${className ?? ""}
				`}
			/>
		</div>
	);
}
