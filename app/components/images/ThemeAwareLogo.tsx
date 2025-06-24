import Image from "next/image";
import { ImageProps } from "next/image";

interface ThemeAwareLogoProps extends Omit<ImageProps, "className"> {
	className?: string;
}

export default function ThemeAwareLogo(props: ThemeAwareLogoProps) {
	const { className = "", ...imageProps } = props;

	return (
		<Image
			{...imageProps}
			className={`
        transition-all duration-200
        [html[data-theme='light']_&]:invert-[0.85]
        [html[data-theme='dark']_&]:invert-0
        ${className}
      `}
		/>
	);
}
