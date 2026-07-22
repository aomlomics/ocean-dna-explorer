"use client";

import { useEffect } from "react";

const ACTIVATION_TOP_PX = 100;
const SCROLL_END_THRESHOLD_PX = 64;
/** When the window is scrolled above this, treat as “top of page” and reset the sidebar TOC scroll. */
const PAGE_TOP_THRESHOLD_PX = 80;

function clearTocHighlight() {
	document.querySelectorAll("a[data-section-index]").forEach((link) => {
		link.classList.remove("text-primary");
	});
	document.querySelectorAll("a[data-toc-target]").forEach((link) => {
		link.classList.remove("text-primary");
	});
}

function highlightActiveLinks(sectionIdx: string | null, subsectionId: string | null) {
	if (sectionIdx !== null) {
		document.querySelectorAll(`a[data-section-index="${sectionIdx}"]`).forEach((el) => {
			el.classList.add("text-primary");
		});
	} else if (subsectionId) {
		document.querySelectorAll("a[data-toc-target]").forEach((el) => {
			if (el.getAttribute("data-toc-target") === subsectionId) {
				el.classList.add("text-primary");
			}
		});
	}
}

function getAsideTocLink(sectionIdx: string | null, subsectionId: string | null): HTMLElement | null {
	const aside = document.querySelector("aside");
	if (!aside) return null;
	if (sectionIdx !== null) {
		const link = aside.querySelector(`a[data-section-index="${sectionIdx}"]`);
		return link instanceof HTMLElement ? link : null;
	}
	if (subsectionId) {
		for (const link of aside.querySelectorAll("a[data-toc-target]")) {
			if (link.getAttribute("data-toc-target") === subsectionId) {
				return link instanceof HTMLElement ? link : null;
			}
		}
	}
	return null;
}

function prefersReducedMotion(): boolean {
	return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function scrollAsideTocToActiveLink(link: HTMLElement) {
	if (!window.matchMedia("(min-width: 1024px)").matches) return;

	const aside = link.closest("aside");
	if (!aside) return;

	link.scrollIntoView({
		block: "nearest",
		inline: "nearest",
		behavior: prefersReducedMotion() ? "auto" : "smooth"
	});
}

function scrollAsideTocToContentsTop(aside: HTMLElement) {
	if (aside.scrollTop < 1) return;
	if (prefersReducedMotion()) {
		aside.scrollTop = 0;
	} else {
		aside.scrollTo({ top: 0, behavior: "smooth" });
	}
}

export function ActiveSectionTracker() {
	useEffect(() => {
		let lastActiveKey: string | null = null;
		let prevWindowScrollY = window.scrollY;

		const scrollToHash = () => {
			if (typeof window === "undefined") return;

			const rawHash = window.location.hash;
			if (!rawHash) return;

			const id = decodeURIComponent(rawHash.slice(1));
			if (!id) return;

			const target = document.getElementById(id);
			if (!target) return;

			target.scrollIntoView({
				behavior: prefersReducedMotion() ? "auto" : "smooth",
				block: "start"
			});
		};

		const updateActiveTocLinks = () => {
			const main = document.querySelector("main");
			if (!main) return;

			const anchors = main.querySelectorAll<HTMLElement>(".doc-toc-anchor");
			if (anchors.length === 0) return;

			let activeEl: HTMLElement | null = null;
			const viewBottom = window.scrollY + window.innerHeight;
			const docBottom = document.documentElement.scrollHeight;

			if (viewBottom >= docBottom - SCROLL_END_THRESHOLD_PX) {
				activeEl = anchors[anchors.length - 1];
			} else {
				for (let i = anchors.length - 1; i >= 0; i--) {
					const el = anchors[i];
					if (el.getBoundingClientRect().top <= ACTIVATION_TOP_PX) {
						activeEl = el;
						break;
					}
				}
				if (!activeEl) activeEl = anchors[0];
			}

			clearTocHighlight();

			if (!activeEl) return;

			const sectionIdx = activeEl.getAttribute("data-section-index");
			let subsectionId: string | null = null;
			let newKey: string;

			if (sectionIdx !== null) {
				newKey = `s:${sectionIdx}`;
				highlightActiveLinks(sectionIdx, null);
			} else {
				subsectionId = activeEl.id || null;
				if (!subsectionId) return;
				newKey = `sub:${subsectionId}`;
				highlightActiveLinks(null, subsectionId);
			}

			const scrollY = window.scrollY;
			const atPageTop = scrollY <= PAGE_TOP_THRESHOLD_PX;
			const enteredPageTopZone =
				prevWindowScrollY > PAGE_TOP_THRESHOLD_PX && scrollY <= PAGE_TOP_THRESHOLD_PX;
			prevWindowScrollY = scrollY;

			const keyChanged = newKey !== lastActiveKey;
			lastActiveKey = newKey;

			const aside = document.querySelector("aside");
			const isDesktopToc = window.matchMedia("(min-width: 1024px)").matches;

			if (
				atPageTop &&
				isDesktopToc &&
				aside instanceof HTMLElement &&
				aside.scrollTop > 0 &&
				enteredPageTopZone
			) {
				scrollAsideTocToContentsTop(aside);
			} else if (!atPageTop && keyChanged) {
				const asideLink = getAsideTocLink(
					sectionIdx !== null ? sectionIdx : null,
					subsectionId
				);
				if (asideLink) {
					scrollAsideTocToActiveLink(asideLink);
				}
			}
		};

		const timeoutId = window.setTimeout(() => {
			scrollToHash();
			requestAnimationFrame(updateActiveTocLinks);
		}, 0);
		window.addEventListener("hashchange", scrollToHash);

		let scrollRaf = 0;
		const onScrollOrResize = () => {
			if (scrollRaf) cancelAnimationFrame(scrollRaf);
			scrollRaf = requestAnimationFrame(() => {
				scrollRaf = 0;
				updateActiveTocLinks();
			});
		};

		const onScrollToTopButton = () => {
			if (!window.matchMedia("(min-width: 1024px)").matches) return;
			const aside = document.querySelector("aside");
			if (aside instanceof HTMLElement) {
				scrollAsideTocToContentsTop(aside);
			}
		};

		window.addEventListener("scroll", onScrollOrResize, { passive: true });
		window.addEventListener("resize", onScrollOrResize);
		window.addEventListener("opal:scroll-to-top", onScrollToTopButton);

		requestAnimationFrame(updateActiveTocLinks);

		return () => {
			window.clearTimeout(timeoutId);
			window.removeEventListener("hashchange", scrollToHash);
			window.removeEventListener("scroll", onScrollOrResize);
			window.removeEventListener("resize", onScrollOrResize);
			window.removeEventListener("opal:scroll-to-top", onScrollToTopButton);
			if (scrollRaf) cancelAnimationFrame(scrollRaf);
		};
	}, []);

	return null;
}
