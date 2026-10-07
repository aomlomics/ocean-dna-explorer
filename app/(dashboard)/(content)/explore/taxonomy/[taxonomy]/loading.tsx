export default function Loading() {
	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="skeleton h-12 w-80" />
					<div className="skeleton h-7 w-24 rounded-md" />
				</div>
				<div className="skeleton h-5 w-72" />
			</header>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="skeleton h-full min-h-105 rounded-lg" />
				<div className="space-y-4">
					<div className="skeleton h-105 rounded-lg" />
					<div className="skeleton h-40 rounded-lg" />
				</div>
				<div className="lg:col-span-2">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-2/3">
						<div className="skeleton h-32 rounded-lg" />
						<div className="skeleton h-32 rounded-lg" />
						<div className="skeleton h-32 rounded-lg" />
						<div className="skeleton h-32 rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
}
