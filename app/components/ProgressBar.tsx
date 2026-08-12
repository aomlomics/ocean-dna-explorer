"use client";

import { NetworkProgressPacket } from "@/types/globals";

export default function ProgressBar({ loading, data }: { loading: boolean; data: NetworkProgressPacket }) {
	let value = 0;
	let message = "";
	if (data) {
		if (data.statusMessage === "success" || data.statusMessage === "progress") {
			if (data.progress) {
				value = data.progress.value;
				message = data.progress.message;
			}
		} else if (data.statusMessage === "error" && data.error) {
			message = data.error;
		}
	}

	return (
		<div className="flex items-center h-2 w-full">
			{data ? (
				<div
					className={`tooltip before:w-full w-full ${
						data.statusMessage === "progress"
							? "tooltip-primary"
							: data.statusMessage === "success"
								? "tooltip-success"
								: data.statusMessage === "error" && "tooltip-error"
					}`}
					data-tip={message}
				>
					<progress
						className={`progress ${
							data.statusMessage === "progress"
								? "progress-primary"
								: data.statusMessage === "success"
									? "progress-success"
									: data.statusMessage === "error" && "progress-error"
						}`}
						value={value}
						max="100"
					></progress>
				</div>
			) : loading ? (
				<progress className="progress progress-primary" value={0} max="100"></progress>
			) : (
				<div className="w-full h-4"></div>
			)}
		</div>
	);
}
