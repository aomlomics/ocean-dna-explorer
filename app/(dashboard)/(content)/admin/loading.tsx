export default function Loading() {
	return (
		<div className="space-y-6" aria-busy="true" aria-label="Loading">
			<div className="skeleton h-10 w-56 max-w-full" />
			<div className="skeleton h-4 w-full max-w-xl" />
			<div className="skeleton h-4 w-2/3 max-w-lg" />
			<div className="skeleton min-h-48 w-full max-w-3xl rounded-lg" />
		</div>
	);
}
