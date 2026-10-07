"use client";

import { type ReactNode, useEffect, useState } from "react";

export default function CollapsibleMapContainer({
	children,
	defaultCollapse = false,
	hiddenText = "Show",
	dir = "right",
	onCollapse
}: {
	children: ReactNode;
	defaultCollapse?: boolean;
	hiddenText?: string;
	dir?: "up" | "down" | "left" | "right";
	onCollapse?: (collapse: boolean) => void;
}) {
	const [collapse, setCollapse] = useState(defaultCollapse);

	//delay 2nd state variable by a render cycle to fix tooltip appearing immediately after collapsing
	const [delayedCollapse, setDelayedCollapse] = useState(defaultCollapse);
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setDelayedCollapse(collapse), [collapse]);

	let rotationOpen;
	let rotationClosed;
	let flexDir;
	let tooltipDir;
	let collapsePos;
	let openRounded;

	if (dir === "up") {
		rotationOpen = "-rotate-90";
		rotationClosed = "rotate-90";
		flexDir = "flex-col";
		tooltipDir = "tooltip-bottom";
		collapsePos = "self-start";
		openRounded = "rounded-t-none pt-1";
	} else if (dir === "down") {
		rotationOpen = "rotate-90";
		rotationClosed = "-rotate-90";
		flexDir = "flex-col";
		tooltipDir = "tooltip-top";
		collapsePos = "self-end";
		openRounded = "rounded-b-none pb-1";
	} else if (dir === "left") {
		rotationOpen = "rotate-180";
		rotationClosed = "";
		flexDir = "flex-row";
		tooltipDir = "tooltip-right";
		collapsePos = "self-start";
		openRounded = "rounded-l-none pl-1";
	} else if (dir === "right") {
		rotationOpen = "";
		rotationClosed = "rotate-180";
		flexDir = "flex-row";
		tooltipDir = "tooltip-left";
		collapsePos = "self-end";
		openRounded = "rounded-r-none pr-1";
	}

	const panel = (
		<div
			className={`card card-xs card-body justify-center min-h-11.25 min-w-11.25 gap-0 bg-base-100 shadow-sm p-0 ${
				collapse ? "hidden" : ""
			}`}
		>
			{children}
		</div>
	);

	return (
		<div className={`flex ${flexDir} ${collapse ? collapsePos : ""}`}>
			{dir === "left" || dir === "up" ? panel : <></>}
			<div
				className={`card bg-base-100 card-xs shadow-sm card-body p-2 self-center justify-center cursor-pointer ${
					collapse ? "" : openRounded
				} ${delayedCollapse ? `tooltip ${tooltipDir} tooltip-secondary before:text-primary-content` : ""}`}
				data-tip={hiddenText}
				onClick={() => {
					setCollapse(!collapse);
					if (onCollapse) {
						onCollapse(!collapse);
					}
				}}
			>
				{collapse ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						className={`text-primary ${rotationClosed}`}
						stroke="currentColor"
						fill="currentColor"
					>
						<g>
							<polygon points="11.707 3.293 10.293 4.707 17.586 12 10.293 19.293 11.707 20.707 20.414 12 11.707 3.293" />
							<polygon points="5.707 3.293 4.293 4.707 11.586 12 4.293 19.293 5.707 20.707 14.414 12 5.707 3.293" />
						</g>
					</svg>
				) : (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						className={`text-primary ${rotationOpen}`}
						stroke="currentColor"
						fill="currentColor"
					>
						<g>
							<polygon points="11.707 3.293 10.293 4.707 17.586 12 10.293 19.293 11.707 20.707 20.414 12 11.707 3.293" />
							<polygon points="5.707 3.293 4.293 4.707 11.586 12 4.293 19.293 5.707 20.707 14.414 12 5.707 3.293" />
						</g>
					</svg>
				)}
			</div>
			{dir === "right" || dir === "down" ? panel : <></>}
		</div>
	);
}
