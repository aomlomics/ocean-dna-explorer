import Image from "next/image";
import { ImageProps } from "next/image";

interface NodeLogoProps extends Omit<ImageProps, "className" | "src"> {
	className?: string;
}

export default function NodeLogo(props: NodeLogoProps) {
	const { className = "", ...imageProps } = props;

	return (
		<div className="relative w-full h-full">
			<Image
				{...imageProps}
				src="/images/node_logo_dark_mode.svg"
				className={`
					absolute inset-0
					transition-opacity duration-200
					[html[data-theme='dark']_&]:opacity-100
					[html[data-theme='light']_&]:opacity-0
					${className}
				`}
			/>
			<Image
				{...imageProps}
				src="/images/node_logo_light_mode.svg"
				className={`
					absolute inset-0
					transition-opacity duration-200
					[html[data-theme='dark']_&]:opacity-0
					[html[data-theme='light']_&]:opacity-100
					${className}
				`}
			/>
		</div>
	);
}
