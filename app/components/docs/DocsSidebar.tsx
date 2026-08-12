"use client";

import useHash from "@/app/hooks/useHash";
import DocsSections, { DocsGenericSection, DocsPage, DocsSection, DocsPageTitles } from "@/types/docsSections";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Fragment } from "react/jsx-runtime";

function getAllSubsections(id: string, sect: DocsSection): string[] {
	const curr = [id];

	if (sect.subsections) {
		for (const [ssId, ss] of Object.entries(sect.subsections)) {
			curr.push(...getAllSubsections(ssId, ss));
		}
	}

	return curr;
}

export default function DocsSidebar() {
	const pathname = usePathname();
	const splitPath = pathname.split("/");
	const page = splitPath[2] as DocsPage;
	const section = splitPath[3] as DocsGenericSection<DocsPage>;

	const hash = useHash();
	const [currSection, setCurrSection] = useState(hash || section);
	const [disableAutoScroll, setDisableAutoScroll] = useState(false);

	const ref = useRef<HTMLElement>(null);

	//detect current section in docs body
	useEffect(() => {
		let animationFrame: number | undefined;

		if (!page) {
			animationFrame = requestAnimationFrame(() => {
				setCurrSection("");
			});

			return () => {
				if (animationFrame !== undefined) {
					cancelAnimationFrame(animationFrame);
				}
			};
		}

		if (!section) {
			return;
		}

		function handleScroll() {
			const ids = getAllSubsections(section, DocsSections[page][section]);
			const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

			//if at the bottom, highlight the last section (10 pixel tolerance)
			const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;

			if (atBottom && elements.length) {
				setCurrSection(elements[elements.length - 1].id);
				return;
			}

			const current = [...elements].reverse().find((el) => el.getBoundingClientRect().top <= 50);

			if (current) {
				setCurrSection(current.id);
			}
		}

		window.addEventListener("scroll", handleScroll, { passive: true });
		animationFrame = requestAnimationFrame(() => {
			handleScroll();
		});

		return () => {
			window.removeEventListener("scroll", handleScroll);

			if (animationFrame !== undefined) {
				cancelAnimationFrame(animationFrame);
			}
		};
	}, [page, section]);

	//auto scroll sidebar to keep current section in view
	useEffect(() => {
		if (!disableAutoScroll) {
			const activeLink = document.getElementById(`sidebar-${currSection}`);
			const sidebar = ref.current;

			if (!activeLink || !sidebar) {
				return;
			}

			const linkRect = activeLink.getBoundingClientRect();
			const sidebarRect = sidebar.getBoundingClientRect();

			const buffer = 16;

			const isAbove = linkRect.top < sidebarRect.top + buffer;
			const isBelow = linkRect.bottom > sidebarRect.bottom - buffer;

			if (isAbove || isBelow) {
				sidebar.scrollTo({
					top: sidebar.scrollTop + linkRect.top - sidebarRect.top - buffer,
					behavior: "smooth"
				});
			}
		}
	}, [currSection]);

	function highlight(id: string) {
		return currSection === id ? "text-primary" : "";
	}

	return (
		<aside
			ref={ref}
			className="h-full px-10 flex flex-col gap-10 overflow-y-auto pb-5"
			onWheel={() => setDisableAutoScroll(true)}
			onTouchMove={() => setDisableAutoScroll(true)}
		>
			{Object.entries(DocsSections).map(([page, sections]) => (
				<div key={page} className="flex flex-col gap-2.5">
					<div className="font-bold border-b border-primary pb-1">{DocsPageTitles[page]}</div>

					<div className="pl-3 flex flex-col gap-4">
						{Object.entries(sections).map(([id, sect]: [string, DocsSection]) => (
							<Fragment key={id}>
								<Link
									id={`sidebar-${id}`}
									href={`/docs/${page}/${id}`}
									className={`py-1 cursor-pointer hover:text-primary transition-colors ${highlight(id)}`}
									onClick={() => {
										setDisableAutoScroll(false);
										if (!hash && section === id) {
											document.getElementById(id)?.scrollIntoView({
												behavior: "smooth",
												block: "start"
											});
										}
									}}
								>
									{sect.title}
								</Link>

								{sect.subsections ? (
									<div className="text-sm border-l border-base-300 pl-4 flex flex-col gap-2.5">
										{Object.entries(sect.subsections).map(([ssId, ss]) => (
											<Link
												key={ssId}
												id={`sidebar-${ssId}`}
												href={`/docs/${page}/${id}#${ssId}`}
												className={`cursor-pointer hover:text-primary transition-colors ${highlight(ssId)}`}
												onClick={() => setDisableAutoScroll(false)}
											>
												{ss.title}
											</Link>
										))}
									</div>
								) : (
									<></>
								)}
							</Fragment>
						))}
					</div>
				</div>
			))}
		</aside>
	);
}
