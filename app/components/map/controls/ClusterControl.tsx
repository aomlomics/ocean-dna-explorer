"use client";

import type { Dispatch, SetStateAction } from "react";
import LeafletControl from "./LeafletControl";
import CollapsibleMapContainer from "../containers/CollapsibleMapContainer";
import ResetButtonMap from "../utils/ResetButtonMap";
import { DEFAULT_CLUSTER_RADIUS } from "../utils/mapUtils";
import InfoButton from "@/app/components/InfoButton";

export default function ClusterControl({
	cluster,
	value,
	onChange,
	clusterRadius
}: {
	cluster: boolean;
	value: number | undefined;
	onChange: Dispatch<SetStateAction<number | undefined>>;
	clusterRadius?: number;
}) {
	if (!cluster) {
		return null;
	}

	return (
		<LeafletControl click className="leaflet-bar border-none!">
			<CollapsibleMapContainer dir="left" defaultCollapse hiddenText="Show cluster control">
				<div className="w-35 pl-2 pr-1 pt-1 pb-2 flex flex-col gap-1">
					<div className="flex justify-between">
						<div className="flex items-center gap-1 mt-1">
							<ResetButtonMap
								disabled={clusterRadius ? value === clusterRadius : value === DEFAULT_CLUSTER_RADIUS}
								dataTip={`Reset to ${clusterRadius || DEFAULT_CLUSTER_RADIUS}`}
								resetFunction={() => onChange(clusterRadius || DEFAULT_CLUSTER_RADIUS)}
								dir="tooltip-right"
							/>
							<span className="text-sm">Cluster</span>
						</div>
						<InfoButton
							text="The distance, in pixels, where points will begin clustering. Set to zero to disable clustering."
							dir="tooltip-right"
							className="self-start"
						/>
					</div>
					<div className="pr-2">
						<input
							type="number"
							className="input input-primary"
							value={value === undefined ? "" : value}
							onChange={(e) => {
								const parsed = parseInt(e.currentTarget.value);
								if (isNaN(parsed)) {
									onChange(undefined);
								} else {
									onChange(parsed);
								}
							}}
						/>
					</div>
				</div>
			</CollapsibleMapContainer>
		</LeafletControl>
	);
}
