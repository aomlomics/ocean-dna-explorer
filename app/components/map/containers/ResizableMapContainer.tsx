"use client";

import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import type { Map } from "leaflet";

/**
 * {@link app/components/map/ActualMap.default | ActualMap} control wrapper that adds a draggable handle that resizes the
 * control in a specified direction.
 */
export default function ResizableMapContainer({
	children,
	growDirection,
	detectChange,
	mapRef,
	maxMapWidth = 0.75,
	maxMapHeight = 0.75,
	maxMinWidth,
	maxMinHeight
}: {
	/** The inner control elements. */
	children: ReactNode;
	/**
	 * The direction that the control is able to be resized into. If "up", then the handle will be on the top of the
	 * control.
	 */
	growDirection: "up" | "down" | "left" | "right";
	/** An array of variables to watch where changes to any variable in the array will trigger a resizing of the control. */
	detectChange?: (string | boolean | undefined)[];
	/** A useRef for the parent map component. */
	mapRef: RefObject<Map | null>;
	/**
	 * The max width that the control is allowed to grow to, compared to the width of the parent map. Defaults to 0.75;
	 * 75% of the map's width.
	 */
	maxMapWidth?: number;
	/**
	 * The max height that the control is allowed to grow to, compared to the height of the parent map. Defaults to 0.75;
	 * 75% of the map's height.
	 */
	maxMapHeight?: number;
	/** The smallest width that the control is able to resize to. */
	maxMinWidth?: number;
	/** The smallest height that the control is able to resize to. */
	maxMinHeight?: number;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const childRef = useRef<HTMLDivElement>(null);

	const [minWidth, setMinWidth] = useState(maxMinWidth);
	const [minHeight, setMinHeight] = useState(maxMinHeight);
	const [width, setWidth] = useState("auto" as number | "auto");
	const [height, setHeight] = useState("auto" as number | "auto");

	const [sizeClassName, setSizeClassName] = useState("invisible" as "w-full h-full" | "invisible");
	const [checkSize, setCheckSize] = useState(false);

	useEffect(() => {
		if (ref.current && (!detectChange || detectChange?.every((c) => !!c))) {
			//unlock child size to allow automatic resizing
			setSizeClassName("invisible");
			setCheckSize(true);
		}
	}, [ref, detectChange]);

	useEffect(() => {
		//TODO: doesn't shrink after resetting legend
		//TODO: don't trigger resize when legendInfo.hidden changes
		//TODO: doesn't change width when shapesInside changes
		//TODO: doesn't change width when filter changes
		if (checkSize && ref.current && childRef.current && mapRef.current) {
			const mapContainer = mapRef.current.getContainer();

			//set new width, and new min width if applicable
			const mapMaxWidth = mapContainer.clientWidth * maxMapWidth;
			const maxRefWidth =
				ref.current.clientWidth > childRef.current.clientWidth ? ref.current.clientWidth : childRef.current.clientWidth;
			if (maxMinWidth) {
				let tempWidth;

				if (maxMinWidth > mapMaxWidth) {
					tempWidth = mapMaxWidth;
				} else if (maxRefWidth >= maxMinWidth) {
					tempWidth = maxMinWidth;
				} else {
					tempWidth = maxRefWidth;
				}

				setMinWidth(tempWidth);
				setWidth(tempWidth);
			} else {
				//set initial min width
				if (!minWidth) {
					setMinWidth(maxRefWidth);
				}

				if (maxRefWidth >= mapMaxWidth) {
					setWidth(mapMaxWidth);
				} else {
					setWidth(maxRefWidth);
				}
			}

			//set new height, and new min height if applicable
			const mapMaxHeight = mapContainer.clientHeight * maxMapHeight;
			const maxRefHeight =
				ref.current.clientHeight > childRef.current.clientHeight
					? ref.current.clientHeight
					: childRef.current.clientHeight;
			if (maxMinHeight) {
				let tempHeight;

				if (maxMinHeight > mapMaxHeight) {
					tempHeight = mapMaxHeight;
				} else if (maxRefHeight >= maxMinHeight) {
					tempHeight = maxMinHeight;
				} else {
					tempHeight = maxRefHeight;
				}

				setMinHeight(tempHeight);
				setHeight(tempHeight);
			} else {
				//set initial min height
				if (!minHeight) {
					setMinHeight(maxRefHeight);
				}

				if (maxRefHeight >= mapMaxHeight) {
					setHeight(mapMaxHeight);
				} else {
					setHeight(maxRefHeight);
				}
			}

			//lock child to size set with state variables
			setSizeClassName("w-full h-full");
			setCheckSize(false);
		}
	}, [checkSize]);

	let gridClassName;
	let handleContainerClassName;
	let handleClassName;

	if (growDirection === "up") {
		handleContainerClassName = "w-full cursor-ns-resize";
		handleClassName = "w-1/2 h-1 my-1";

		gridClassName = "grid-rows-[auto_minmax(0,1fr)]";
	} else if (growDirection === "down") {
		handleContainerClassName = "w-full cursor-ns-resize";
		handleClassName = "w-1/2 h-1 my-1";

		gridClassName = "grid-rows-[minmax(0,1fr)_auto]";
	} else if (growDirection === "left") {
		handleContainerClassName = "h-full cursor-ew-resize";
		handleClassName = "w-1 h-1/2 mx-1";

		gridClassName = "grid-cols-[minmax(0,1fr)_auto]";
	} else if (growDirection === "right") {
		handleContainerClassName = "h-full cursor-ew-resize";
		handleClassName = "w-1 h-1/2 mx-1";

		gridClassName = "grid-cols-[auto_minmax(0,1fr)]";
	}

	function handleDrag(event: React.MouseEvent<HTMLDivElement>) {
		document.body.classList.add("select-none");

		const startWidth = width as number;
		const startHeight = height as number;
		const startX = event.pageX;
		const startY = event.pageY;

		function handleMouseMove(this: HTMLElement, ev: MouseEvent) {
			if (minWidth && minHeight && mapRef.current) {
				const mapContainer = mapRef.current.getContainer();
				const mapMaxWidth = mapContainer.clientWidth * maxMapWidth;
				const mapMaxHeight = mapContainer.clientHeight * maxMapHeight;

				if (growDirection === "right") {
					const newWidth = startWidth + startX - ev.pageX;
					if (newWidth >= minWidth && newWidth <= mapMaxWidth) {
						setWidth(newWidth);
					}
				} else if (growDirection === "left") {
					const newWidth = startWidth - startX + ev.pageX;
					if (newWidth >= minWidth && newWidth <= mapMaxWidth) {
						setWidth(newWidth);
					}
				} else if (growDirection === "up") {
					const newHeight = startHeight + startY - ev.pageY;
					if (newHeight >= minHeight && newHeight <= mapMaxHeight) {
						setHeight(newHeight);
					}
				} else if (growDirection === "down") {
					const newHeight = startHeight - startY + ev.pageY;
					if (newHeight >= minHeight && newHeight <= mapMaxHeight) {
						setHeight(newHeight);
					}
				}
			}
		}

		document.body.addEventListener("mousemove", handleMouseMove);
		document.body.addEventListener(
			"mouseup",
			() => {
				document.body.classList.remove("select-none");
				document.body.removeEventListener("mousemove", handleMouseMove);
			},
			{ once: true }
		);
	}

	const handle = (
		<div className={`justify-center items-center flex ${handleContainerClassName}`} onMouseDownCapture={handleDrag}>
			<div className={`bg-gray-400 rounded-full hidden lg:block ${handleClassName}`}></div>
		</div>
	);
	return (
		<div style={{ width, height }}>
			<div ref={ref} className={`grid ${gridClassName} ${sizeClassName}`}>
				{growDirection === "left" || growDirection === "up" ? handle : <></>}
				<div ref={childRef} className="flex p-3">
					{children}
				</div>
				{growDirection === "right" || growDirection === "down" ? handle : <></>}
			</div>
		</div>
	);
}
