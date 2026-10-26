import Link from "next/link";
import TrustedToggle from "../header/TrustedToggle";

export default function DisableTrustedMode() {
	return (
		<div className="grid grid-cols-2 gap-20 self-center items-center grow max-w-4xl">
			<div className="justify-self-end">
				<h1 className="text-primary text-6xl mb-10">This data is Non-trusted</h1>
				<h2 className="mb-3 text-xl text-base-content/80 sm:text-2xl">Disable Trusted Mode</h2>
				<p>
					This data exists but it is <span className="text-warning">Non-trusted</span>.{" "}
					<Link className="link link-primary link-hover" href="/docs/help/overview#trusted-vs-untrusted-data">
						Trusted Mode
					</Link>{" "}
					is enabled by default. You may have ended up here from a direct link. To view this data, please use the toggle
					to the right to <span className="text-error">disable</span> Trusted Mode.
				</p>
			</div>
			<div className="justify-self-start">
				<TrustedToggle className="size-40 text-primary" />
			</div>
		</div>
	);
}
