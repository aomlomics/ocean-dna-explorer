import Image from "next/image";

export default function ThemeAwareSvg({
	lightSrc,
	darkSrc,
	alt,
	className,
	sizes
}: {
	lightSrc: string;
	darkSrc: string;
	alt: string;
	className?: string;
	sizes: string;
}) {
	return (
		<div className="relative w-full h-full" style={{ backgroundColor: "inherit" }}>
			<Image
				src={darkSrc}
				alt={alt}
				sizes={sizes}
				className={`absolute inset-0 transition-opacity duration-200 [html[data-theme='dark']_&]:opacity-100 [html[data-theme='light']_&]:opacity-0${className ?? ""}`}
				style={{ backgroundColor: "transparent" }}
			/>
			<Image
				src={lightSrc}
				alt={alt}
				sizes={sizes}
				className={`absolute inset-0 transition-opacity duration-200 [html[data-theme='dark']_&]:opacity-0 [html[data-theme='light']_&]:opacity-100${className ?? ""}`}
				style={{ backgroundColor: "transparent" }}
			/>
		</div>
	);
}
