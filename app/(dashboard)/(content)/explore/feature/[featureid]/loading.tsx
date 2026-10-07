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
				<div className="skeleton h-5 w-1/2" />
			</header>
			<section className="space-y-6">
				<div className="space-y-2">
					<div className="skeleton h-4 w-24" />
					<div className="skeleton h-10 w-full" />
					<div className="skeleton h-4 w-60" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="skeleton h-72 rounded-xl" />
					<div className="skeleton h-72 rounded-xl" />
					<div className="skeleton h-40 rounded-xl" />
				</div>
				<div className="space-y-4">
					<div className="skeleton h-7 w-44" />
					<div className="skeleton h-80 rounded-xl" />
				</div>
			</section>
		</div>
	);
}
