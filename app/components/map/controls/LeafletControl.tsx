"use client";

import { DomEvent } from "leaflet";
import { ReactNode, useEffect, useRef } from "react";

export default function LeafletControl({
	click,
	scroll,
	className,
	style,
	children
}: {
	click?: true;
	scroll?: true;
	className?: string;
	style?: Record<string, string>;
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
