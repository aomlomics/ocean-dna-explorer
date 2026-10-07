"use client";

import { TrustedActionHover } from "@/app/components/home/HomeTrustedIndicator";
import { useTrusted } from "@/app/hooks/TrustedProvider";
import { TrustedIcon, UntrustedIcon } from "../icons";

export default function TrustedToggle({ className }: { className?: string }) {
	const { trusted, setTrusted } = useTrusted();

	return (
		<TrustedActionHover trusted={trusted}>
			<label className="swap swap-rotate">
				<input
					type="checkbox"
					checked={trusted}
					onChange={(e) => setTrusted(e.target.checked)}
					aria-label={TrustedActionLabel()}
				/>

				<TrustedIcon className={`swap-on ${className ?? ""}`} />
				<UntrustedIcon className={`swap-off ${className ?? ""}`} />
			</label>
		</TrustedActionHover>
	);
}

export function TrustedLabel() {
	const { trusted } = useTrusted();
	return trusted ? "Trusted data" : "All data (untrusted)";
}

export function TrustedActionLabel() {
	const { trusted } = useTrusted();
	return trusted ? "Show all data" : "Show only trusted data";
}
