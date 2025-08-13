export default function LoadingText({ width, color }: { width?: string; color?: string }) {
	return (
		<div className="w-full flex">
			{"\u200b"}
			<span
				className={`my-1.25 rounded-3xl opacity-60 ${width || "grow"} ${color ? "bg-" + color : "bg-primary-content"}`}
			></span>
		</div>
	);
}
