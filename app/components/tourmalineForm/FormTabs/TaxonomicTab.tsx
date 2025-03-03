import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";
import React from "react";

export default function TaxonomicTab({
	register,
	errors,
	selectedTaxClassifier
}: {
	register: any;
	errors: FieldErrors<any>;
	selectedTaxClassifier: "naive-bayes" | "consensus-blast" | "consensus-vsearch";
}) {
	const methodInfos = {
		"naive-bayes": "Naive-Bayes: Create a scikit-learn naive_bayes classifier for reads.",
		"consensus-blast": "BLAST: Assign taxonomy to query sequences using BLAST+. Performs BLAST+ local alignment...",
		"consensus-vsearch":
			"VSearch: Assign taxonomy to query sequences using VSEARCH. Performs VSEARCH global alignment..."
	};

	const infoText = methodInfos[selectedTaxClassifier] || "Select a classifier method to see more information.";

	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Taxonomic Classification</h1>
			</div>
			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Taxonomic Classifier Method</span>
						<span className="label-text-alt">
							<InfoButton infoText={infoText} />
						</span>
					</div>
					<select
						{...register("taxClassMethod")}
						className={`select select-bordered bg-neutral-content w-full ${errors.taxClassMethod && "select-error"}`}
					>
						<option disabled value="">
							Select Classifier Method
						</option>
						<option value="naive-bayes">Naive Bayes</option>
						<option value="consensus-blast">BLAST </option>
						<option value="consensus-vsearch">VSearch</option>
					</select>
				</label>
			</div>
			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Taxonomic Level</span>
						<span className="label-text-alt">
							<InfoButton infoText="The taxonomic level at which the features should be collapsed. All ouput features will have exactly this many levels of taxonomic annotation." />
						</span>
					</div>
					<select
						{...register("taxonomicLevel")}
						className={`select select-bordered bg-neutral-content w-full ${errors.taxonomicLevel && "select-error"}`}
					>
						<option value="" disabled>
							Select Level
						</option>
						{Array(7)
							.fill(null)
							.map((_, i) => (
								<option key={i + 1} value={i + 1}>
									{i + 1}
								</option>
							))}
					</select>
				</label>
				{errors.taxonomicLevel && (
					<div className="label">
						<span className="label-text-alt text-red-500">Please select an option</span>
					</div>
				)}
			</div>
		</div>
	);
}
