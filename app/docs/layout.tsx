"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/header/Header";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import DocsSidebar from "../components/docs/DocsSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	const headerRef = useRef<HTMLDivElement>(null);
	const [headerHeight, setHeaderHeight] = useState(0);
	const [headerVisible, setHeaderVisible] = useState(true);

	useEffect(() => {
		if (!headerRef.current) return;

		const resizeObserver = new ResizeObserver(([entry]) => {
			setHeaderHeight(entry.contentRect.height);
		});
		resizeObserver.observe(headerRef.current);

		const intersectObserver = new IntersectionObserver(([entry]) => setHeaderVisible(entry.isIntersecting), {
			threshold: 0
		});
		intersectObserver.observe(headerRef.current);

		return () => {
			resizeObserver.disconnect();
			intersectObserver.disconnect();
		};
	}, []);

	return (
		<>
			<div ref={headerRef}>
				<Header />
			</div>
			<main
				id="main-content"
				className="w-[85%] mx-auto sm:w-[80%] md:w-[75%] lg:w-[75%] xl:w-[80%] lg:grid lg:grid-cols-[15fr_85fr] lg:gap-10 pb-5"
			>
				<div
					className="hidden lg:block sticky top-0 pt-10"
					style={{ height: `calc(100dvh - ${headerVisible ? headerHeight : 0}px)` } as CSSProperties}
				>
					<DocsSidebar />
				</div>
				<div className="pt-10 pb-5 px-4 md:px-6 lg:px-8 overflow-x-auto">{children}</div>
			</main>
			<Footer />
		</>
	);
}
