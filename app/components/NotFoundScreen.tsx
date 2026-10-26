import Link from "next/link";
import { RovIcon } from "@/app/components/icons";

export default function NotFoundScreen() {
	return (
		<main id="main-content" className="flex min-h-0 grow flex-col">
			<div className="mx-auto flex min-h-0 w-full max-w-4xl grow flex-col items-center gap-8 px-6 pb-12 md:flex-row md:items-stretch md:gap-10 md:px-12 md:pb-0 lg:px-16">
				<div className="order-2 w-full max-w-md md:order-1 md:flex md:flex-1 md:flex-col md:justify-center md:py-12">
					<p className="mb-1 select-none text-[clamp(5.5rem,22vw,13rem)] font-light text-primary">404</p>
					<h1 className="mb-3 text-xl text-base-content/80 sm:text-2xl">Page not found</h1>
					<p className="mb-8 text-base-content/80">
						Looks like you drifted off course. The page you&apos;re looking for doesn&apos;t exist or it may have been
						moved.
					</p>
					<Link href="/" className="btn btn-primary btn-md w-fit min-h-12 px-8">
						Home
					</Link>
				</div>

				<div
					role="img"
					aria-label="Remotely operated vehicle suspended on a tether"
					className="relative h-80 w-36 shrink-0 overflow-hidden md:order-2 md:h-auto md:min-h-0 md:w-44 lg:w-48"
				>
					<RovIcon className="absolute inset-x-0 -top-10 bottom-0 w-full rotate-2 text-primary md:-top-40 md:bottom-[-15%] lg:-top-44" />
				</div>
			</div>
		</main>
	);
}
