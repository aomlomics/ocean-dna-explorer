"use client";

import { DomEvent } from "leaflet";
import { type ReactNode, useEffect, useRef } from "react";

/**
 * Base utility wrapper for custom {@link app/components/map/ActualMap.default | ActualMap} controls. Its main purpose is
 * to disable click and scroll propagation.
 */
export default function LeafletControlContainer({
	click,
	scroll,
	className,
	style,
	children
}: {
	/** Whether the component should disable click propagation. */
	click?: true;
	/** Whether the component should disable scroll propagation. */
	scroll?: true;
	/** Override for the className styling. */
	className?: string;
	/** Override for the HTML style prop. */
	style?: Record<string, string>;
	/** The inner control elements. */
	children: ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			if (click) DomEvent.disableClickPropagation(ref.current);
			if (scroll) DomEvent.disableScrollPropagation(ref.current);
		}
	}, []);

	return (
		<div className={`leaflet-control ${className ?? ""}`} ref={ref} style={style}>
			{children}
		</div>
	);
}
