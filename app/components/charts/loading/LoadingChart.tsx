export default function LoadingChart() {
	return (
		<div className="w-full aspect-video border-l border-b border-base-content/30 relative">
			<div className="absolute inset-0 flex flex-col justify-between">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="border-t border-base-content/10" />
				))}
			</div>

			<div className="absolute inset-0 flex justify-between">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="border-l border-base-content/10" />
				))}
			</div>
		</div>
	);
}
