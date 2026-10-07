export default function Loading() {
	return (
		<div className="space-y-8 pb-8">
			<div className="breadcrumbs text-base">
				<ul>
					<li>
						<div className="skeleton h-4 w-24" />
					</li>
					<li>
						<div className="skeleton h-4 w-32" />
					</li>
					<li>
						<div className="skeleton h-4 w-28" />
					</li>
					<li>
						<div className="skeleton h-4 w-52" />
					</li>
				</ul>
			</div>
			<header className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="skeleton h-12 w-120 max-w-full" />
					<div className="skeleton h-7 w-20 rounded-full" />
				</div>
				<div className="skeleton h-5 w-11/12" />
				<div className="skeleton h-5 w-9/12" />
			</header>
			<section className="space-y-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="skeleton aspect-square rounded-xl" />
					<div className="lg:col-span-2 bg-base-200 rounded-xl p-6 space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-3 flex flex-col items-center">
								<div className="skeleton size-32 rounded-full" />
								<div className="skeleton h-6 w-40" />
								<div className="skeleton h-12 w-28" />
							</div>
							<div className="space-y-3">
								<div className="skeleton h-24 rounded-lg" />
								<div className="skeleton h-24 rounded-lg" />
							</div>
						</div>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="skeleton h-24 rounded-lg" />
					<div className="skeleton h-24 rounded-lg" />
					<div className="skeleton h-24 rounded-lg" />
				</div>
			</section>
		</div>
	);
}
