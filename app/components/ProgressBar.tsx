"use client";

import { NetworkProgressPacket } from "@/types/globals";

export default function ProgressBar({ loading, data }: { loading: boolean; data: NetworkProgressPacket }) {
	return (
		<>
			{loading &&
				(data ? (
					(data.statusMessage === "progress" || data.statusMessage === "success") && (
						<>
							<progress className="progress progress-primary w-56" value={data?.progress?.value} max="100"></progress>
							{data.progress?.message}
						</>
					)
				) : (
					<progress className="progress progress-primary w-56" value={0} max="100"></progress>
				))}
		</>
	);
}
