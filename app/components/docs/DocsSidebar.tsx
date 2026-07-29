"use client";

import DocsSections, { DocsSection } from "@/types/docsSections";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react/jsx-runtime";

const linkStyles = "cursor-pointer hover:text-primary transition-colors";

//TODO: make sure current section is scrolled into view on page load
//TODO: change highlight when scrolling down page to current subsection
//TODO: remove all unused components from docs folder
export default function DocsSidebar() {
	const pathname = usePathname();

	function highlight(id: string) {
		return pathname.endsWith(id) ? "text-primary" : "";
	}

	return (
		<aside className="h-full px-10 flex flex-col gap-15 overflow-y-auto pb-5">
			{Object.entries(DocsSections).map(([page, sections]) => (
				<div key={page} className="flex flex-col gap-2.5">
					<div className="font-bold border-b border-primary pb-1">{page}</div>

					<div className="pl-3 flex flex-col gap-4">
						{Object.entries(sections).map(([id, sect]: [string, DocsSection]) => (
							<Fragment key={id}>
								<Link
									href={`/docs/${page.toLowerCase()}/${id}`}
									className={`py-1 ${linkStyles} ${highlight(`${page.toLowerCase()}/${id}`)}`}
								>
									{sect.title}
								</Link>

								{sect.subsections ? (
									<div className="text-sm border-l border-base-300 pl-4 flex flex-col gap-2.5">
										{Object.entries(sect.subsections).map(([ssId, ss]) => (
											<Link
												key={ssId}
												href={`/docs/${page.toLowerCase()}/${id}#${ssId}`}
												className={`${linkStyles} ${highlight(`${page.toLowerCase()}/${id}#${ssId}`)}`}
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
