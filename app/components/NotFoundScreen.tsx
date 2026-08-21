import Link from "next/link";

export default function NotFoundScreen() {
	return (
		<main
			id="main-content"
			className="relative flex min-h-0 grow flex-col overflow-hidden bg-base-100 text-base-content"
		>
			{/* Centered shell — wide screens grow the side margins only */}
			<div className="mx-auto flex min-h-0 w-full max-w-4xl grow flex-col items-center gap-8 px-6 pb-12 md:flex-row md:items-stretch md:gap-10 md:px-12 md:pb-0 lg:px-16">
				<div className="order-2 w-full max-w-md md:order-1 md:flex md:flex-1 md:flex-col md:justify-center md:py-12">
					<p className="mb-1 select-none text-[clamp(5.5rem,22vw,13rem)] leading-none font-light tracking-wide text-primary">
						404
					</p>
					<h1 className="mb-3 text-xl font-normal text-base-content/80 sm:text-2xl">Page not found</h1>
					<p className="mb-8 text-base leading-relaxed text-base-content/80">
						Looks like you drifted off course. The page you&apos;re looking for doesn&apos;t exist or it may have been
						moved.
					</p>
					<Link href="/" className="btn btn-primary btn-md w-fit min-h-12 px-8 text-base font-normal">
						Home
					</Link>
				</div>

				{/* Full-height column so the tether meets the top of the page */}
				<div className="relative order-1 h-80 w-36 shrink-0 overflow-hidden md:order-2 md:h-auto md:min-h-0 md:w-44 lg:w-48">
					<div
						role="img"
						aria-label="Remotely operated vehicle suspended on a tether"
						className="not-found-rov absolute inset-x-0 -top-10 bottom-0 rotate-2 bg-primary md:-top-40 md:bottom-[-15%] lg:-top-44"
					/>
				</div>
			</div>
		</main>
	);
}
