"use client";

import { Dispatch, SetStateAction } from "react";
import LeafletControl from "./LeafletControl";
import CollapsibleMapContainer from "../containers/CollapsibleMapContainer";
import ResetButtonMap from "../utils/ResetButtonMap";
import { DEFAULT_POINT_SIZE, DEFAULT_POINT_SIZE_STEP } from "../utils/mapUtils";
import InfoButton from "../../InfoButton";

export default function PointSizeControl({
	pointSize,
	setPointSize,
	pointSizeStep,
	setPointSizeStep
}: {
	pointSize: number | undefined;
	setPointSize: Dispatch<SetStateAction<number | undefined>>;
	pointSizeStep: number | undefined;
	setPointSizeStep: Dispatch<SetStateAction<number | undefined>>;
}) {
	return (
		<LeafletControl click className="leaflet-bar border-none!">
			<CollapsibleMapContainer dir="left" defaultCollapse hiddenText="Show point size control">
				<div className="w-35 pl-2 pr-1 pt-1 pb-2 flex flex-col gap-1">
					<div className="flex justify-between">
						<div className="flex items-center gap-1 mt-1">
							<ResetButtonMap
								disabled={pointSize === DEFAULT_POINT_SIZE}
								dataTip={"Reset to " + DEFAULT_POINT_SIZE}
								resetFunction={() => setPointSize(DEFAULT_POINT_SIZE)}
								dir="tooltip-right"
							/>
							<span className="text-sm">Point Size</span>
						</div>
						<InfoButton
							text="The size, in pixels, that the smallest points will be. Every power of 10 increases point size by the step."
							dir="tooltip-right"
							className="self-start"
						/>
					</div>
					<div className="pr-2">
						<input
							type="number"
							className="input input-primary"
							value={pointSize === undefined ? "" : pointSize}
							onChange={(e) => {
								const parsed = parseInt(e.currentTarget.value);
								if (isNaN(parsed)) {
									setPointSize(undefined);
								} else {
									setPointSize(parsed);
								}
							}}
						/>
					</div>

					<div className="flex items-center gap-1">
						<ResetButtonMap
							disabled={pointSizeStep === DEFAULT_POINT_SIZE_STEP}
							dataTip={"Reset to " + DEFAULT_POINT_SIZE_STEP}
							resetFunction={() => setPointSizeStep(DEFAULT_POINT_SIZE_STEP)}
							dir="tooltip-right"
						/>
						<span className="text-sm">Step</span>
					</div>
					<div className="pr-2">
						<input
							type="number"
							className="input input-primary"
							value={pointSizeStep === undefined ? "" : pointSizeStep}
							onChange={(e) => {
								const parsed = parseInt(e.currentTarget.value);
								if (isNaN(parsed)) {
									setPointSizeStep(undefined);
								} else {
									setPointSizeStep(parsed);
								}
							}}
						/>
					</div>
				</div>
			</CollapsibleMapContainer>
		</LeafletControl>
	);
}
