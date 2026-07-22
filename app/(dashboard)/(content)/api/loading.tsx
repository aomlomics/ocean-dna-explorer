export default function Loading() {
	return (
		<div className="flex min-h-screen items-start">
			<aside className="hidden lg:block w-64 min-w-[16rem] border-r border-base-300 pt-9 p-6 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
				<div className="skeleton h-7 w-28 mb-6 px-2" />
				<ul className="space-y-5">
					{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
						<li key={i} className="px-2 space-y-2">
							<div className="skeleton h-5 w-full" />
							<div className="skeleton h-4 w-4/5 ml-2" />
						</li>
					))}
				</ul>
			</aside>

			<main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto space-y-8">
				<div className="skeleton h-10 w-full max-w-md rounded-lg lg:hidden" />

				<div className="space-y-16">
					<section className="space-y-4">
						<div className="skeleton h-11 w-4/5 max-w-xl" />
						<div className="skeleton h-4 w-full" />
						<div className="skeleton h-4 w-11/12" />
						<div className="skeleton h-4 w-10/12" />
						<div className="skeleton h-56 w-full rounded-lg" />
					</section>
					<section className="space-y-4">
						<div className="skeleton h-11 w-3/4 max-w-lg" />
						<div className="skeleton h-4 w-full" />
						<div className="skeleton h-4 w-9/12" />
						<div className="skeleton h-48 w-full rounded-lg" />
					</section>
				</div>
			</main>
		</div>
	);
}
