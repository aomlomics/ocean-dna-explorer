"use client";

import DocsSections, { DocsGenericProps, DocsPage, DocsSection, getNextDocsSection } from "@/types/docsSections";
import Link from "next/link";
import { ReactNode } from "react";

const docContentProseClassName =
	"prose max-w-none " +
	"[&_p]:text-base [&_p]:leading-relaxed " +
	"[&_ul]:text-base [&_ol]:text-base " +
	"[&_h4]:text-lg [&_h4]:font-medium [&_h4]:text-base-content [&_h4]:mt-6 [&_h4]:mb-1.5 " +
	"[&_div>h4:first-child]:!mt-0 " +
	"[&_h5]:text-lg [&_h5]:font-medium [&_h5]:text-base-content [&_h5]:mt-6 [&_h5]:mb-1.5 " +
	"[&_table_code]:text-base [&_table_code]:font-mono";

//TODO: add previous/next buttons to bottom of every page
//TODO: add route breadcrumbs
export default function DocsPageSection<P extends DocsPage>({
	page,
	section,
	header,
	subsections
}: DocsGenericProps<P> & {
	header: ReactNode;
	subsections?: { id: string; title: string; content: ReactNode }[];
}) {
	const prev = getNextDocsSection({ page, section, dir: -1 });
	const next = getNextDocsSection({ page, section });

	return (
		<section className="mr-100 flex flex-col gap-5">
			<h2 className="text-4xl font-semibold tracking-tight text-primary mb-3">
				{(DocsSections[page][section] as DocsSection).title}
			</h2>
			<div className={docContentProseClassName}>{header}</div>

			{subsections ? (
				subsections.map((sect) => (
					<DocsPageSubsection key={sect.id} id={sect.id} title={sect.title} content={sect.content} />
				))
			) : (
				<></>
			)}

			<div className="flex justify-around w-full pt-10">
				{prev ? (
					<Link className="btn" href={`/docs/${prev.page}/${prev.section}`}>
						Previous
					</Link>
				) : (
					<></>
				)}
				{next ? (
					<Link className="btn" href={`/docs/${next.page}/${next.section}`}>
						Next
					</Link>
				) : (
					<></>
				)}
			</div>
		</section>
	);
}

function DocsPageSubsection({ id, title, content }: { id: string; title: string; content: ReactNode }) {
	return (
		<div id={id}>
			<h3 className="text-3xl font-semibold tracking-tight text-base-content mb-2">{title}</h3>
			<div className={docContentProseClassName}>{content}</div>
		</div>
	);
}
