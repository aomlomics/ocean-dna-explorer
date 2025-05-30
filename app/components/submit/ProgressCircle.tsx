export default function ProgressCircle({
	response,
	error,
	loading,
	hasFile
}: {
	response?: string;
	error?: string;
	loading?: boolean;
	hasFile?: boolean;
}) {
	return (
		<div
			className={`
			w-6 h-6 rounded-full 
			flex items-center justify-center 
			border-[1.5px] transition-colors duration-200
			${
				error
					? "border-error bg-error/10"
					: response
					? "border-primary bg-primary text-white"
					: loading
					? "border-primary animate-pulse"
					: hasFile
					? "border-primary"
					: "border-primary/40"
			}
		`}
		>
			{loading ? (
				<span className="loading loading-spinner loading-xs text-primary"></span>
			) : error ? (
				<span className="text-white text-xs">✕</span>
			) : response ? (
				<span className="text-white text-xs">✓</span>
			) : hasFile ? (
				<span className="text-primary text-xs">•</span>
			) : null}
		</div>
	);
}
