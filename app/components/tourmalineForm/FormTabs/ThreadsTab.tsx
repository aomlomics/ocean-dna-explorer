import InfoButton from "@/app/components/InfoButton";
import { FieldErrors } from "react-hook-form/dist/types/errors";

export default function ThreadsTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	function ThreadDropdown({ reg, title, error }: { reg: string; title: string; error: any }) {
		return (
			<div className="space-y-4 p-1 flex items-center">
				<label className="form-control w-1/2 max-w-xs">
					<span className="label-text">{title}</span>
					<select
						{...register(reg)}
						className={`select select-bordered bg-neutral-content w-full ${error && "select-error"}`}
					>
						<option value="" disabled>
							Select the Number of Threads
						</option>
						{Array.from({ length: 8 }, (_, i) => (
							<option key={i + 1} value={i + 1}>
								{i + 1}
							</option>
						))}
					</select>
				</label>
				<InfoButton infoText="More information about DADA2 Paired-end Threads" />
				{error && (
					<div className="label">
						<span className="label-text-alt text-red-500">Please select an option</span>
					</div>
				)}
			</div>
		);
	}

	return (
		<>
			<ThreadDropdown
				reg={"dada2pe_threads"}
				title={"DADA2 Paired-end Threads"}
				error={errors.dada2pe_threads}
			></ThreadDropdown>
			<ThreadDropdown
				reg={"dada2se_threads"}
				title={"DADA2 Single-end Threads"}
				error={errors.dada2se_threads}
			></ThreadDropdown>
			<ThreadDropdown reg={"deblur_threads"} title={"Deblur Threads"} error={errors.deblur_threads}></ThreadDropdown>
			<ThreadDropdown
				reg={"alignment_threads"}
				title={"Alignment Threads"}
				error={errors.alignment_threads}
			></ThreadDropdown>
			<ThreadDropdown
				reg={"feature_classifier_threads"}
				title={"Feature Classifier Threads"}
				error={errors.feature_classifier_threads}
			></ThreadDropdown>
			<ThreadDropdown
				reg={"phylogeny_fasttree_threads"}
				title={"Phylogeny FastTree Threads"}
				error={errors.phylogeny_fasttree_threads}
			></ThreadDropdown>
			<ThreadDropdown
				reg={"diversity_core_metrics_phylogenetic_threads"}
				title={"Diversity Core Metrics Phylogenetic Threads"}
				error={errors.diversity_core_metrics_phylogenetic_threads}
			></ThreadDropdown>
			<ThreadDropdown reg={"other_threads"} title={"Other Threads"} error={errors.other_threads}></ThreadDropdown>
		</>
	);
}
