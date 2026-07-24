"use client";

import { useEffect, useRef, useState } from "react";

/** Count-up when the element scrolls into view; respects prefers-reduced-motion. */
export function StatCountUp({ value }: { value: number }) {
	const ref = useRef<HTMLSpanElement>(null);
	const [ready, setReady] = useState(false);
	const [display, setDisplay] = useState(0);
	const [prefersReduced, setPrefersReduced] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReduced(mq.matches);
		const onChange = () => setPrefersReduced(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const markReadyIfVisible = () => {
			const rect = el.getBoundingClientRect();
			const vh = window.innerHeight;
			if (rect.top < vh && rect.bottom > 0) setReady(true);
		};

		markReadyIfVisible();
		const raf = requestAnimationFrame(markReadyIfVisible);

		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) setReady(true);
			},
			{ threshold: 0.05, rootMargin: "0px 0px 0px 0px" }
		);
		io.observe(el);
		return () => {
			cancelAnimationFrame(raf);
			io.disconnect();
		};
	}, []);

	useEffect(() => {
		if (prefersReduced) {
			setDisplay(value);
			return;
		}
		if (!ready) {
			setDisplay(0);
			return;
		}

		let cancelled = false;
		let raf = 0;
		const duration = 1500;
		const startAt = performance.now() + 50;

		function step(now: number) {
			if (cancelled) return;
			if (now < startAt) {
				raf = requestAnimationFrame(step);
				return;
			}
			const elapsed = now - startAt;
			const t = Math.min(1, elapsed / duration);
			const eased = 1 - (1 - t) ** 3;
			setDisplay(Math.round(eased * value));
			if (t < 1) raf = requestAnimationFrame(step);
		}
		setDisplay(0);
		raf = requestAnimationFrame(step);
		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
		};
	}, [ready, value, prefersReduced]);

	const shown = prefersReduced ? value : !ready ? 0 : display;

	return (
		<span ref={ref} className="tabular-nums">
			{shown.toLocaleString()}
		</span>
	);
}
