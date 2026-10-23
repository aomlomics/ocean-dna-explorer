import { UntrustedIcon } from "../icons";

export default function UntrustedInTrustedMode() {
	return (
		<div
			className="tooltip tooltip-warning before:z-50 cursor-pointer flex gap-2 badge badge-warning py-3.5 px-2"
			data-tip="You are currently viewing non-trusted data while in trusted mode. This page is behaving as if trusted mode is disabled, showing all data. The data you see on this page may not be reflected on the rest of the site."
		>
			<UntrustedIcon />
			<span>Non-trusted</span>
		</div>
	);
}
