"use client";

import { useTrusted } from "@/app/hooks/TrustedProvider";
import { TrustedIcon, UntrustedIcon } from "../icons";

export default function TrustedToggle({ className }: { className?: string }) {
	const { trusted, setTrusted } = useTrusted();
	const actionLabel = trusted ? "Show all data" : "Show only trusted data";

	return (
		<div
			className="tooltip tooltip-bottom before:text-base-content before:bg-base-200 before:border before:border-base-content/20"
			data-tip={actionLabel}
		>
			<label className="swap swap-rotate">
				<input
					type="checkbox"
					checked={trusted}
					onChange={(e) => setTrusted(e.target.checked)}
					aria-label={actionLabel}
				/>

				<TrustedIcon className={`swap-on ${className ?? ""}`} />
				<UntrustedIcon className={`swap-off ${className ?? ""}`} />
			</label>
		</div>
	);
}

export function TrustedLabel() {
	const { trusted } = useTrusted();
	return trusted ? "Trusted data" : "All data (untrusted)";
}
