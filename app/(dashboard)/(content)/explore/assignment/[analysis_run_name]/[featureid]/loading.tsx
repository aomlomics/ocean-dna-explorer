export default function Loading() {
	return (
		<div className="space-y-8 pb-8">
			<div className="breadcrumbs text-base">
				<ul>
					<li>
						<div className="skeleton h-4 w-24" />
					</li>
					<li>
						<div className="skeleton h-4 w-28" />
					</li>
				</ul>
			</div>
			<header className="space-y-4">
				<div className="skeleton h-12 w-52" />
				<div className="bg-base-200 rounded-xl px-5 py-4 inline-flex items-center gap-5">
					<div className="space-y-2">
						<div className="skeleton h-4 w-40" />
						<div className="skeleton h-10 w-28" />
					</div>
					<div className="skeleton size-18 rounded-full" />
				</div>
				<div className="space-y-2">
					<div className="skeleton h-5 w-11/12" />
					<div className="skeleton h-5 w-10/12" />
					<div className="skeleton h-5 w-9/12" />
				</div>
				<div className="skeleton h-5 w-8/12" />
			</header>
		</div>
	);
}
