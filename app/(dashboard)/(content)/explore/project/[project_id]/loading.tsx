export default function Loading() {
	return (
		<div className="space-y-8 pb-8">
			<div className="breadcrumbs text-base">
				<ul>
					<li>
						<div className="skeleton h-4 w-20" />
					</li>
					<li>
						<div className="skeleton h-4 w-40" />
					</li>
				</ul>
			</div>
			<header className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="skeleton h-12 w-80" />
					<div className="skeleton h-7 w-20 rounded-full" />
				</div>
				<div className="skeleton h-5 w-2/3" />
				<div className="skeleton h-4 w-3/4" />
			</header>
			<div className="space-y-4">
				<div className="skeleton h-7 w-56" />
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="skeleton h-24 rounded-lg" />
					<div className="skeleton h-24 rounded-lg" />
					<div className="skeleton h-24 rounded-lg" />
					<div className="skeleton h-24 rounded-lg" />
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 skeleton h-96 rounded-xl" />
				<div className="skeleton aspect-square rounded-xl" />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 bg-base-200 rounded-xl p-6 space-y-3">
					<div className="skeleton h-7 w-52" />
					<div className="skeleton h-4 w-full" />
					<div className="skeleton h-4 w-11/12" />
					<div className="skeleton h-4 w-10/12" />
					<div className="skeleton h-48 w-full rounded-lg" />
				</div>
				<div className="space-y-4">
					<div className="skeleton h-44 rounded-xl" />
					<div className="skeleton h-56 rounded-xl" />
				</div>
			</div>
			<div className="space-y-4">
				<div className="skeleton h-7 w-64" />
				<div className="skeleton h-72 w-full rounded-xl" />
			</div>
		</div>
	);
}
