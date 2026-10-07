"use client";

import { ClearAllButton } from "../../explore/ActionBar";

export default function TableStatusState({
	kind,
	title,
	detail,
	onClear
}: {
	kind: "loading" | "error" | "empty";
	title: string;
	detail?: string;
	onClear?: () => void;
}) {
	const icon =
		kind === "loading" ? (
			<span className="loading loading-spinner loading-md text-primary" />
		) : kind === "error" ? (
			<span className="text-2xl text-error" aria-hidden="true">
				⚠
			</span>
		) : (
			<span className="text-2xl text-base-content/50" aria-hidden="true">
				⌕
			</span>
		);

	return (
		<div aria-live="polite" className="rounded-box border border-base-300 bg-base-100 p-8">
			<div className="mx-auto flex min-h-55 max-w-2xl flex-col items-center justify-center gap-3 text-center">
				{icon}
				<h3 className="text-lg font-semibold text-base-content">{title}</h3>
				{detail ? <p className="max-w-xl text-sm text-base-content/70">{detail}</p> : null}
				{onClear && kind !== "loading" ? (
					<div className="mt-1">
						<ClearAllButton onClear={onClear} />
					</div>
				) : null}
				{kind === "loading" ? (
					<div className="mt-3 flex w-full max-w-md flex-col gap-2">
						<div className="h-3 w-full animate-pulse rounded-full bg-base-300/80" />
						<div className="h-3 w-[82%] animate-pulse rounded-full bg-base-300/70" />
						<div className="h-3 w-[64%] animate-pulse rounded-full bg-base-300/60" />
					</div>
				) : null}
			</div>
		</div>
	);
}
