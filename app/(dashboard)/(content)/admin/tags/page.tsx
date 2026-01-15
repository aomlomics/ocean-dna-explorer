import AddTagButton from "@/app/components/tags/AddTagButton";
import AnalysisTag from "@/app/components/tags/AnalysisTag";
import DeleteTagButton from "@/app/components/tags/DeleteTagButton";
import { prisma } from "@/app/helpers/prisma";

export default async function AddTags() {
	const tags = await prisma.tag.findMany({
		orderBy: {
			id: "desc"
		},
		include: {
			Analyses: {
				select: {
					analysis_run_name: true
				}
			}
		}
	});
	return (
		<div className="space-y-6">
			<AddTagButton />

			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Analysis Tags</h2>
				<p className="text-sm opacity-70">
					{tags.length} tag{tags.length === 1 ? "" : "s"} in database
				</p>
			</div>

			{tags.length === 0 ? (
				<div className="alert">
					<span>No tags found. Add one with the button above.</span>
				</div>
			) : (
				<div className="flex gap-5 flex-wrap">
					{tags.map((t) => (
						<div key={t.id} className="card bg-base-200 p-2 shadow flex items-center gap-2">
							<AnalysisTag tag={t} />

							<span className="badge badge-ghost">
								{t.Analyses.length} Analys{t.Analyses.length === 1 ? "i" : "e"}s
							</span>

							<DeleteTagButton tag={t} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}
