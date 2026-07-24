export default function Loading() {
	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="skeleton h-12 w-80" />
					<div className="skeleton h-7 w-24 rounded-md" />
				</div>
				<div className="flex items-center gap-4">
					<div className="skeleton h-5 w-96" />
					<div className="skeleton h-9 w-24 rounded-md" />
				</div>
				<div className="skeleton h-5 w-72" />
			</header>
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				<div className="lg:col-span-2 grid grid-cols-1 gap-4">
					<div className="skeleton h-80 rounded-lg" />
					<div className="skeleton h-40 rounded-lg" />
				</div>
				<div className="lg:col-span-2 space-y-4">
					<div className="skeleton h-105 rounded-lg" />
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-fr">
						<div className="skeleton h-32 rounded-lg" />
						<div className="skeleton h-32 rounded-lg" />
						<div className="skeleton h-32 rounded-lg" />
						<div className="skeleton h-32 rounded-lg sm:col-span-3" />
					</div>
				</div>
			</div>
		</div>
	);
}
