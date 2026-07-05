"use client";

import LogoIcon from "./LogoIcon";

export default function LoadingSpinner() {
	return (
		<div className="fixed inset-0 z-loading bg-base-100 flex flex-col items-center justify-center h-full w-full gap-4">
			<LogoIcon className="w-20 h-20" />
			<span className="loading loading-spinner loading-lg text-primary"></span>
		</div>
	);
}
