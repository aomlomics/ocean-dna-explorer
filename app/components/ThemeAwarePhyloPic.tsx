import Image, { ImageProps } from "next/image";

interface ThemeAwarePhyloPicProps extends Omit<ImageProps, "className"> {
	className?: string;
}

export default function ThemeAwarePhyloPic(props: ThemeAwarePhyloPicProps) {
	const { className = "", ...imageProps } = props;

	return (
		<Image
			{...imageProps}
			className={`
        transition-all duration-200
        [html[data-theme='light']_&]:[filter:invert(17%)_sepia(31%)_saturate(4408%)_hue-rotate(209deg)_brightness(93%)_contrast(84%)]
        [html[data-theme='dark']_&]:[filter:invert(75%)_sepia(6%)_saturate(7117%)_hue-rotate(175deg)_brightness(93%)_contrast(83%)]
        ${className}
      `}
		/>
	);
}
