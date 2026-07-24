"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<div className="tour-motion-bg flex min-h-screen items-center justify-center bg-base-200 px-6 text-base-content [html[data-theme='dark']_&]:bg-base-300/50">
			<div className="w-full max-w-2xl rounded-3xl border border-base-content/10 bg-base-100/70 p-6 shadow-2xl shadow-base-content/10 backdrop-blur-md">
				<h2 className="text-xl font-semibold text-primary">Showcase crashed</h2>
				<p className="mt-2 text-sm text-base-content/70">
					This page hit a runtime error. The details below help pinpoint what went wrong.
				</p>
				<pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-base-300/40 p-4 text-xs leading-relaxed text-base-content/80">
					{error.message}
					{error.digest ? `\n\nDigest: ${error.digest}` : ""}
				</pre>
				<div className="mt-5 flex justify-end">
					<button type="button" className="btn btn-primary" onClick={() => reset()}>
						Retry
					</button>
				</div>
			</div>
		</div>
	);
}

