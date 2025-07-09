"use client";

import { NetworkProgressPacket } from "@/types/globals";
import { useEffect, useState } from "react";

export default function ProgressBar({ loading, data }: { loading: boolean; data: NetworkProgressPacket }) {
	const [value, setValue] = useState(0);
	const [message, setMessage] = useState("");

	useEffect(() => {
		if (data) {
			console.log(data);
			if ((data.statusMessage === "success" || data.statusMessage === "progress") && data.progress) {
				setValue(data.progress.value);
				setMessage(data.progress.message);
			} else if (data.statusMessage === "error" && data.error) {
				setMessage(data.error);
			}
		}
	}, [data]);

	return (
		<div className="flex items-center h-full">
			{data ? (
				<div
					className={`tooltip w-full ${
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
			) : (
				loading && <progress className="progress progress-primary" value={0} max="100"></progress>
			)}
		</div>
	);
}
