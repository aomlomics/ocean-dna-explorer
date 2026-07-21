import { BlastResult } from "@/types/globals";

//TODO: style
export default function BlastSearchResult({ blastResult }: { blastResult: BlastResult }) {
	return (
		<div className="break-all">
			{blastResult.map((q, i) => (
				<div key={i}>
					{q.database}
					{q.query}
					{q.sequence}
					<div>
						{q.BlastQueryResults.map((r, j) => (
							<div key={i + "." + j}>
								{Object.entries(r).map(([f, v]) => (
									<div key={f + i + "." + j}>
										{f}: {v}
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
