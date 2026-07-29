import DocsPageSection from "@/app/components/docs/DocsPageSection";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";

export default async function HelpSearchPage() {
	const project = await prisma.project.findFirst({
		orderBy: {
			id: "asc"
		},
		select: {
			project_id: true,
			Samples: {
				take: 1,
				select: {
					samp_name: true
				}
			}
		}
	});

	return (
		<DocsPageSection
			page="Help"
			section="search"
			header={
				<>
					<p className="mb-4">
						The{" "}
						<Link className="link link-primary font-semibold" href="/search">
							Search
						</Link>{" "}
						page allows you to make complex queries across multiple tables using an intuitive search interface. This is
						different from the{" "}
						<Link className="link link-primary font-semibold" href="#explore">
							Explore
						</Link>{" "}
						pages, which only let you filter data within a single table.
					</p>
					<p className="mb-4">
						Use Search when you need to find data based on relationships between tables (e.g., "find all taxonomies in a
						specific project" or "find all samples from a particular analysis").
					</p>
				</>
			}
			subsections={[
				{
					id: "how-to-use-search",
					title: "How to Use the Search Page",
					content: (
						<>
							<p className="mb-4">
								The{" "}
								<Link className="link link-primary font-semibold" href="/search">
									Search
								</Link>{" "}
								page provides an intuitive query builder that lets you construct complex filters across different data
								tables.
							</p>

							<p className="mb-4">To use the Search page:</p>
							<ol className="list-decimal ml-6 mb-4">
								<li>Select which table you want to search</li>
								<li>Add filters using the query builder to specify your search criteria</li>
								<li>
									Filters can include conditions based on fields from related tables (e.g., search for Samples where the
									Project's institution is "NOAA")
								</li>
								<li>
									Combine multiple filters using AND/OR logic: Each filter and/or relation is combined with AND logic.
									You can add an OR condition (the filters and/or relations within the OR group are combined with OR
									logic), and the OR block itself is combined with the other filters and/or relations with AND logic
									(the same as any other filter or relation).
								</li>
								<li>Further filter those results by drawing on a map</li>
								<li>Start exploring</li>
							</ol>
							<p className="mb-4">Remember, you can always copy a search as an API query!</p>
						</>
					)
				},
				{
					id: "search-vs-explore",
					title: "Search vs Explore",
					content: (
						<>
							<p className="mb-4">What's the difference between the Search and Explore pages?</p>
							<div className="mb-4">
								<h4>
									Use{" "}
									<Link className="link link-primary" href="/search">
										Search
									</Link>{" "}
									when:
								</h4>
								<ul className="list-disc ml-6 mb-4">
									<li>You need to query across multiple tables (e.g., find taxonomies from a specific project)</li>
									<li>You want to filter based on relationships between different data types</li>
									<li>You need complex query logic with multiple conditions</li>
									<li>You want to view or filter search results on a map</li>
								</ul>
							</div>
							<div className="mb-4">
								<h4>
									Use{" "}
									<Link className="link link-primary" href="/explore">
										Explore
									</Link>{" "}
									when:
								</h4>
								<ul className="list-disc ml-6 mb-4">
									<li>You want to browse all data in a single table</li>
									<li>You only need to filter within one table's own fields</li>
									<li>You want a quick overview and are not asking a specific question</li>
								</ul>
							</div>
						</>
					)
				},
				{
					id: "query-recipes",
					title: "Query Examples",
					content: (
						<>
							<p className="mb-4">
								Unsure where to start? Click the cards below to open the Search page with a pre-filled query builder:
							</p>

							<div className="flex gap-8">
								<Link href={`/search?table=sample&advanced=[["project_id","equals","${project?.project_id}"]]`}>
									<div className="group flex flex-col items-center text-center p-6 rounded-lg bg-base-200 hover:bg-base-300 transition-all duration-300 hover:scale-105 w-64">
										<div className="w-16 h-16 mb-3 flex items-center justify-center text-primary">
											<svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
												<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
											</svg>
										</div>
										<div className="text-sm font-sans font-medium uppercase tracking-wider">
											View All Samples in a Project
										</div>
									</div>
								</Link>

								<Link
									href={`/search?table=taxonomy&advanced=[["sample","samp_name","equals","${project?.Samples[0]?.samp_name}"]]`}
								>
									<div className="group flex flex-col items-center text-center p-6 rounded-lg bg-base-200 hover:bg-base-300 transition-all duration-300 hover:scale-105 w-64">
										<div className="w-16 h-16 mb-3 flex items-center justify-center text-primary">
											<svg viewBox="0 0 1536 592" fill="currentColor" className="w-12 h-12">
												<g transform="translate(0.000000,592.000000) scale(0.100000,-0.100000)">
													<path d="M7037 5902 c-31 -19 -151 -172 -289 -365 -50 -71 -107 -147 -126 -170 -70 -84 -269 -397 -357 -561 -107 -200 -138 -239 -198 -254 -115 -29 -449 -55 -1257 -97 -1271 -66 -1607 -107 -2420 -291 -1390 -315 -2197 -634 -2335 -921 -10 -21 -21 -64 -23 -95 -4 -57 -3 -59 35 -95 22 -21 55 -47 74 -58 63 -37 40 -54 -109 -81 -43 -8 -39 -35 14 -82 101 -92 600 -404 847 -531 186 -95 360 -161 597 -226 113 -31 347 -96 520 -145 813 -229 1308 -330 2070 -425 396 -49 498 -68 514 -94 3 -5 12 -45 20 -89 8 -46 31 -118 54 -169 22 -49 48 -116 57 -149 28 -98 62 -182 134 -332 81 -165 111 -211 201 -308 36 -39 88 -102 115 -140 107 -153 169 -194 296 -194 66 0 81 4 120 28 64 42 319 312 319 339 0 5 36 67 79 137 97 156 131 238 138 331 10 133 -53 235 -212 340 -45 30 -113 68 -151 83 -73 30 -100 56 -74 72 8 5 21 8 28 5 14 -5 308 -27 617 -47 306 -19 918 -17 1160 4 264 23 496 36 860 48 366 12 474 7 531 -26 62 -35 176 -163 261 -293 42 -64 92 -141 112 -171 20 -30 76 -96 126 -146 49 -50 115 -119 146 -155 39 -44 79 -76 130 -105 56 -31 85 -55 118 -100 86 -114 363 -374 399 -374 19 0 88 67 121 117 32 49 83 201 100 298 5 33 15 112 21 175 41 404 205 650 676 1017 214 167 241 189 232 198 -4 4 -82 2 -175 -4 -227 -15 -524 5 -515 35 13 44 769 191 1150 224 183 15 265 3 465 -70 155 -56 251 -86 877 -275 351 -107 658 -212 830 -285 148 -63 579 -211 796 -274 328 -94 424 -88 424 27 0 82 -68 237 -180 406 -34 51 -81 135 -106 185 -51 104 -129 212 -270 374 -230 263 -282 336 -319 449 -16 52 -16 54 8 105 37 81 107 157 282 306 245 208 519 486 595 602 78 119 175 313 167 334 -11 27 -113 51 -217 50 -152 -1 -461 -58 -930 -169 -124 -30 -346 -83 -495 -118 -148 -36 -335 -77 -415 -92 -228 -44 -551 -110 -720 -149 -313 -71 -380 -77 -592 -50 -428 53 -1498 323 -1498 377 0 19 469 -15 595 -43 22 -5 66 -10 98 -10 80 0 76 21 -13 64 -145 72 -231 154 -299 285 -80 157 -98 244 -111 551 -18 396 -31 601 -40 626 -37 97 -326 -101 -1195 -819 l-289 -240 -221 26 c-895 107 -1296 159 -1333 173 -28 10 -47 25 -53 41 -9 24 -6 33 48 176 15 39 16 50 5 65 -29 39 -42 86 -53 179 -21 193 16 352 107 453 19 21 31 40 27 43 -4 2 -39 15 -78 27 -104 34 -198 84 -233 125 -37 41 -42 91 -17 152 34 81 9 89 -101 32 l-85 -43 -32 17 c-43 24 -76 78 -89 145 -20 107 -34 120 -91 84z" />
												</g>
											</svg>
										</div>
										<div className="text-sm font-sans font-medium uppercase tracking-wider">
											View Taxonomies Found in a Sample
										</div>
									</div>
								</Link>
							</div>
						</>
					)
				}
			]}
		/>
	);
}
