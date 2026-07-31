export default function Loading() {
	return (
		<div className="space-y-8 pb-8">
			<div className="breadcrumbs text-base">
				<ul>
					<li><div className="skeleton h-4 w-20" /></li>
					<li><div className="skeleton h-4 w-36" /></li>
				</ul>
			</div>
			<header className="space-y-3">
				<div className="skeleton h-12 w-72" />
				<div className="skeleton h-5 w-4/5" />
				<div className="skeleton h-5 w-2/3" />
			</header>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
				<div className="lg:col-span-2 bg-base-200 rounded-xl p-6 space-y-3">
					<div className="skeleton h-7 w-44" />
					<div className="skeleton h-4 w-full" />
					<div className="skeleton h-4 w-11/12" />
					<div className="skeleton h-4 w-10/12" />
					<div className="skeleton h-56 w-full rounded-lg" />
				</div>
				<div className="space-y-4">
					<div className="skeleton h-24 w-2/3 rounded-lg" />
					<div className="skeleton h-24 w-2/3 rounded-lg" />
				</div>
			</div>
		</div>
	);
}
