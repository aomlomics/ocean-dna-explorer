export default function Loading() {
	return (
		<div className="space-y-8">
			<div className="breadcrumbs text-base">
				<ul>
					<li><div className="skeleton h-4 w-20" /></li>
					<li><div className="skeleton h-4 w-24" /></li>
					<li><div className="skeleton h-4 w-24" /></li>
					<li><div className="skeleton h-4 w-40" /></li>
				</ul>
			</div>
			<header className="space-y-3">
				<div className="flex items-center gap-2">
					<div className="skeleton h-12 w-96" />
					<div className="skeleton h-7 w-20 rounded-full" />
					<div className="skeleton h-7 w-20 rounded-full" />
				</div>
				<div className="skeleton h-5 w-1/2" />
			</header>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				<div className="lg:col-span-2 space-y-6">
					<div className="skeleton h-[440px] rounded-xl" />
					<div className="bg-base-200 rounded-xl p-6 space-y-3">
						<div className="skeleton h-7 w-56" />
						<div className="skeleton h-4 w-full" />
						<div className="skeleton h-4 w-11/12" />
						<div className="skeleton h-48 w-full rounded-lg" />
					</div>
				</div>
				<div className="space-y-8">
					<div className="space-y-4">
						<div className="skeleton h-7 w-52" />
						<div className="skeleton h-14 w-full rounded-lg" />
						<div className="grid grid-cols-2 gap-4">
							<div className="skeleton h-24 rounded-lg" />
							<div className="skeleton h-24 rounded-lg" />
							<div className="skeleton h-24 rounded-lg" />
						</div>
					</div>
					<div className="space-y-3">
						<div className="skeleton h-7 w-72" />
						<div className="skeleton h-14 rounded-lg" />
					</div>
				</div>
			</div>
			<div className="space-y-4">
				<div className="skeleton h-7 w-44" />
				<div className="skeleton h-80 w-full rounded-xl" />
			</div>
		</div>
	);
}
