import DocsSections, {
	DocsGenericProps,
	DocsPage,
	DocsPageTitles,
	DocsSection,
	getNextDocsSection
} from "@/types/docsSections";
import Link from "next/link";
import { ReactNode } from "react";
import MobileTOC from "./MobileTOC";

const docContentProseClassName =
	"prose max-w-none " +
	"[&_p]:text-base [&_p]:leading-relaxed " +
	"[&_ul]:text-base [&_ol]:text-base " +
	"[&_h4]:text-lg [&_h4]:font-medium [&_h4]:text-base-content [&_h4]:mt-6 [&_h4]:mb-1.5 " +
	"[&_div>h4:first-child]:!mt-0 " +
	"[&_h5]:text-lg [&_h5]:font-medium [&_h5]:text-base-content [&_h5]:mt-6 [&_h5]:mb-1.5 " +
	"[&_table_code]:text-base [&_table_code]:font-mono";

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
		<section className="flex flex-col">
			<div className="lg:hidden">
				<MobileTOC />
			</div>

			<div id={section as string}>
				<div className="breadcrumbs text-sm text-base-content/70">
					<ul>
						<li>Docs</li>
						<li>{DocsPageTitles[page]}</li>
						<li className="text-base-content">{(DocsSections[page][section] as DocsSection).title}</li>
					</ul>
				</div>

				<h2 className="text-4xl font-semibold tracking-tight text-primary mb-3 pt-5">
					{(DocsSections[page][section] as DocsSection).title}
				</h2>
				<div className={docContentProseClassName}>{header}</div>
			</div>

			{subsections ? (
				subsections.map((sect) => (
					<DocsPageSubsection key={sect.id} id={sect.id} title={sect.title} content={sect.content} />
				))
			) : (
				<></>
			)}

			<div className="flex justify-center gap-50 w-full mt-10 pt-7 border-t border-base-content/20 text-base-content/50">
				{prev ? (
					<Link
						className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] items-center hover:text-base-content transition-colors"
						href={`/docs/${prev.page}/${prev.section}`}
					>
						<div className="col-start-2">Previous</div>
						<svg
							className="size-7 rotate-90 p-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth={2.5}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
						</svg>
						<div className="text-base-content text-xl">
							{prev.page !== page ? DocsPageTitles[prev.page] + ": " : ""}
							{prev.title}
						</div>
					</Link>
				) : (
					<></>
				)}
				{next ? (
					<Link
						className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] items-center hover:text-base-content transition-colors"
						href={`/docs/${next.page}/${next.section}`}
					>
						<div className="col-span-2">Next</div>
						<div className="text-base-content text-xl">
							{next.page !== page ? DocsPageTitles[next.page] + ": " : ""}
							{next.title}
						</div>
						<svg
							className="size-7 -rotate-90 p-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth={2.5}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
						</svg>
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
		<div id={id} className="pt-5">
			<h3 className="text-3xl font-semibold tracking-tight text-base-content mb-2">{title}</h3>
			<div className={docContentProseClassName}>{content}</div>
		</div>
	);
}
