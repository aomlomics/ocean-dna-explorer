import { ODE_ASV_HEADERS, ODE_ASV_ROWS, ODE_OCCURRENCE_HEADERS, ODE_OCCURRENCE_ROWS } from "./docExampleAnalysisData";

const theadCell = "px-4 py-3 text-left text-sm font-medium text-base-content/90 border-b border-base-content/10";

const theadRow = "bg-base-200/40";

const dataCell = "border-b border-base-content/[0.06] px-4 py-2.5 text-sm align-middle text-base-content/85";

const tableWrap = "rounded-2xl border border-base-content/10 bg-base-100/40 p-4 sm:p-5 shadow-sm";

export function AnalysisAsvTablePreview() {
	return (
		<div className="not-prose my-10 space-y-5">
			<div>
				<h3 className="text-lg font-semibold tracking-tight text-base-content">ASV Taxa Features</h3>
				<p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
					Example shape from a{" "}
					<a
						className="link link-primary"
						href="https://github.com/aomlomics/tourmaline/tree/develop"
						target="_blank"
						rel="noopener noreferrer"
					>
						Tourmaline
					</a>{" "}
					export. Sample rows from{" "}
					<a
						className="link link-primary"
						href="https://github.com/aomlomics/ODE_testdata/tree/main/noaa-sefsc-gu1901"
						target="_blank"
						rel="noopener noreferrer"
					>
						ODE_testdata (noaa-sefsc-gu1901)
					</a>
					; column order matches that project&apos;s export.
				</p>
			</div>
			<div className={tableWrap}>
				<div className="overflow-x-auto rounded-xl -mx-1 px-1">
					<table className="w-full min-w-300 border-collapse text-left">
						<thead>
							<tr className={theadRow}>
								{ODE_ASV_HEADERS.map((h) => (
									<th key={h} className={`${theadCell} whitespace-nowrap`}>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{ODE_ASV_ROWS.map((row, rowIdx) => (
								<tr key={row.featureid} className={rowIdx % 2 === 0 ? "bg-base-100/50" : "bg-base-200/12"}>
									<td
										className={`${dataCell} max-w-40 truncate font-mono text-xs text-base-content/80`}
										title={row.featureid}
									>
										{row.featureid}
									</td>
									<td
										className={`${dataCell} max-w-md truncate font-mono text-[0.7rem] leading-snug text-base-content/75`}
										title={row.dna_sequence}
									>
										{row.dna_sequence}
									</td>
									{row.cells.map((cell, j) => (
										<td key={`${row.featureid}-c${j}`} className={`${dataCell} text-base-content/85`}>
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

export function AnalysisOccurrenceTablePreview() {
	return (
		<div className="not-prose my-10 space-y-5">
			<div>
				<h3 className="text-lg font-semibold tracking-tight text-base-content">Occurrence Table</h3>
				<p className="mt-1.5 text-sm leading-relaxed text-base-content/65">
					Example shape from{" "}
					<a
						className="link link-primary"
						href="https://github.com/aomlomics/tourmaline/tree/develop"
						target="_blank"
						rel="noopener noreferrer"
					>
						Tourmaline
					</a>
					. Matching <code className="text-sm">featureid</code> values tie to the ASV table above; other columns are{" "}
					<code className="text-sm">lib_id</code> values from metadata. Scroll horizontally to see all libraries.
				</p>
			</div>
			<div className={tableWrap}>
				<div className="overflow-x-auto rounded-xl -mx-1 px-1">
					<table className="w-full min-w-[1600px] border-collapse text-left">
						<thead>
							<tr className={theadRow}>
								{ODE_OCCURRENCE_HEADERS.map((h, i) => (
									<th
										key={h}
										className={`${theadCell} whitespace-nowrap ${i === 0 ? "text-left" : "text-right tabular-nums"}`}
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{ODE_OCCURRENCE_ROWS.map((row, i) => {
								const rowBg = i % 2 === 0 ? "bg-base-100/50" : "bg-base-200/12";
								return (
									<tr key={row.id} className={rowBg}>
										<td
											className={`${dataCell} max-w-40 truncate font-mono text-xs text-base-content/80`}
											title={row.id}
										>
											{row.id}
										</td>
										{row.counts.map((n, j) => (
											<td
												key={`${row.id}-${j}`}
												className={`whitespace-nowrap ${dataCell} text-right tabular-nums text-base-content/85 ${
													n === 0 ? "text-base-content/30" : ""
												}`}
											>
												{n}
											</td>
										))}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
