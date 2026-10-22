"use client";

import { useTrusted } from "@/app/hooks/TrustedProvider";
import { UntrustedIcon } from "../icons";

export default function UntrustedInTrustedMode({ trusted }: { trusted: boolean }) {
	const { trusted: trustedToggle, setTrusted } = useTrusted();

	if (trusted || !trustedToggle) {
		return <></>;
	}

	return (
		<div
			className="tooltip tooltip-warning before:z-50 cursor-pointer flex gap-2 badge badge-warning py-3.5 px-2"
			data-tip="You are currently viewing untrusted data while in trusted mode. Data you see on this page may not be reflected on the rest of the site. To remedy this, click here to disable trusted mode."
			onClick={() => setTrusted(false)}
		>
			<UntrustedIcon />
			<span>Untrusted</span>
		</div>
	);
}
