export default function Loading() {
	return (
		<div className="space-y-8 pb-8">
			<div className="breadcrumbs text-base">
				<ul>
					<li>
						<div className="skeleton h-4 w-16" />
					</li>
					<li>
						<div className="skeleton h-4 w-48" />
					</li>
				</ul>
			</div>
			<header>
				<div className="flex gap-2 items-center">
					<div className="skeleton h-12 w-72" />
					<div className="skeleton h-7 w-20 rounded-full" />
				</div>
			</header>
			<section className="mt-2 space-y-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<div className="skeleton h-96 rounded-xl" />
						<div className="skeleton h-64 rounded-xl" />
						<div className="skeleton h-64 rounded-xl" />
						<div className="skeleton h-24 rounded-xl" />
					</div>
					<div className="space-y-8">
						<div className="space-y-4">
							<div className="skeleton h-7 w-52" />
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="skeleton h-24 rounded-lg" />
								<div className="skeleton h-24 rounded-lg" />
								<div className="skeleton h-24 sm:col-span-2 rounded-lg" />
							</div>
						</div>
						<div className="bg-base-200 rounded-xl p-6 space-y-3">
							<div className="skeleton h-7 w-44" />
							<div className="skeleton h-4 w-full" />
							<div className="skeleton h-4 w-11/12" />
							<div className="skeleton h-48 w-full rounded-lg" />
						</div>
					</div>
				</div>
				<div className="space-y-4">
					<div className="skeleton h-7 w-28" />
					<div className="skeleton h-80 rounded-xl" />
				</div>
			</section>
		</div>
	);
}
