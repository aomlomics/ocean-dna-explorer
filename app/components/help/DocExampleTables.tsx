import {
	ODE_ASV_HEADERS,
	ODE_ASV_ROWS,
	ODE_OCCURRENCE_HEADERS,
	ODE_OCCURRENCE_ROWS
} from "./docExampleAnalysisData";

/** Alternating column backgrounds (0 = first column). */
function colStripe(colIndex: number) {
	return colIndex % 2 === 0 ? "bg-base-100" : "bg-base-200/50";
}

const theadCell = "px-3 py-3.5 text-left text-sm font-semibold text-base-content";

const theadRow = "bg-base-300 border-b border-base-content/10 shadow-sm";

const dataCell = "border-b border-base-200/90 px-3 py-2.5 text-sm align-middle";

export function AnalysisAsvTablePreview() {
	return (
		<div className="not-prose my-6">
			<p className="mb-3 text-base text-base-content/90">
				Sample rows from{" "}
				<a
					className="link link-primary"
					href="https://github.com/aomlomics/ODE_testdata/tree/main/noaa-sefsc-gu1901"
					target="_blank"
					rel="noopener noreferrer"
				>
					ODE_testdata (noaa-sefsc-gu1901)
				</a>
				. Column order matches Tourmaline export for this project.
			</p>
			<div className="overflow-hidden rounded-xl border border-base-300/70 bg-base-100 shadow-md">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[1200px] border-collapse text-left">
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
								<tr key={row.featureid} className={rowIdx === ODE_ASV_ROWS.length - 1 ? "[&>td]:border-b-0" : undefined}>
									<td
										className={`${dataCell} max-w-40 truncate font-mono text-xs text-base-content/90 ${colStripe(0)} border-r border-base-200/60`}
										title={row.featureid}
									>
										{row.featureid}
									</td>
									<td
										className={`${dataCell} max-w-md truncate font-mono text-[0.7rem] leading-snug text-base-content/80 ${colStripe(1)}`}
										title={row.dna_sequence}
									>
										{row.dna_sequence}
									</td>
									{row.cells.map((cell, j) => {
										const col = j + 2;
										return (
											<td key={`${row.featureid}-c${j}`} className={`${dataCell} text-base-content/90 ${colStripe(col)}`}>
												{cell}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

export function AnalysisOccurrenceMatrixPreview() {
	return (
		<div className="not-prose my-6">
				<p className="mb-3 text-base text-base-content/90">
					Matching <code className="text-sm">featureid</code> values from the ASV table above. Library columns are{" "}
					<code className="text-sm">lib_id</code> values from metadata. Scroll horizontally to see all libraries.
				</p>
				<div className="overflow-hidden rounded-xl border border-base-300/70 bg-base-100 shadow-md">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[2400px] border-collapse text-left">
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
								{ODE_OCCURRENCE_ROWS.map((row, i) => (
									<tr key={row.id} className={i === ODE_OCCURRENCE_ROWS.length - 1 ? "[&>td]:border-b-0" : undefined}>
										<td
											className={`sticky left-0 z-1 ${dataCell} max-w-44 truncate border-r border-base-300/80 font-mono text-[0.7rem] text-base-content/90 shadow-[3px_0_8px_-4px_rgba(0,0,0,0.12)] ${colStripe(
												0
											)}`}
											title={row.id}
										>
											{row.id}
										</td>
										{row.counts.map((n, j) => {
											const col = j + 1;
											const stripe = colStripe(col);
											const pad = `${dataCell} text-right tabular-nums ${stripe}`;
											return (
												<td
													key={`${row.id}-${j}`}
													className={`whitespace-nowrap ${pad} ${n === 0 ? "text-base-content/35" : "text-base-content"}`}
												>
													{n}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
	);
}
