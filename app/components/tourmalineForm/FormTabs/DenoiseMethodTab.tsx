import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";
import ErrorMessage from "@/app/components/tourmalineForm/ErrorMessage";
import TextField from "@/app/components/tourmalineForm/TextField";

export default function DenoiseMethodTab({
	register,
	errors,
	selectedDenoiseMethod
}: {
	register: any;
	errors: FieldErrors<any>;
	selectedDenoiseMethod: "DADA2 paired-end" | "DADA2 single-end" | "Deblur single-end";
}) {
	//Function to render appropriate fields depending on denoiseMethod
	function renderDenoiseFields() {
		switch (selectedDenoiseMethod) {
			case "DADA2 paired-end":
				return (
					<>
						<div className="flex gap-x-4">
							<TextField
								register={register}
								errors={errors}
								name="dada2pe_trunc_len_f"
								label="Forward Truncation Length"
								infoButton={<InfoButton infoText="Position at which forward read sequences should be truncated..." />}
								ErrorMessageComponent={ErrorMessage}
							/>
							<TextField
								register={register}
								errors={errors}
								name="dada2pe_trunc_len_r"
								label="Reverse Truncation Length"
								infoButton={<InfoButton infoText="Position at which reverse read sequences should be truncated..." />}
								ErrorMessageComponent={ErrorMessage}
							/>
						</div>
						<div className="flex gap-x-4">
							<TextField
								register={register}
								errors={errors}
								name="dada2pe_trim_left_f"
								label="Forward Read 5' Trimming Position"
								infoButton={
									<InfoButton infoText="Position at which forward read sequences should be trimmed due to low quality. This trims the 5' end of the input sequences, which will be the bases that were sequenced in the first cycles." />
								}
								ErrorMessageComponent={ErrorMessage}
							/>
							<TextField
								register={register}
								errors={errors}
								name="dada2pe_trim_left_r"
								label="Reverse Read 5' Trimming Position"
								infoButton={
									<InfoButton infoText="Position at which reverse read sequences should be trimmed due to low quality. This trims the 5' end of the input sequences, which will be the bases that were sequenced in the first cycles." />
								}
								ErrorMessageComponent={ErrorMessage}
							/>
						</div>
						<div className="flex gap-x-4">
							<TextField
								register={register}
								errors={errors}
								name="dada2pe_max_ee_f"
								label="Forward Max Expected Errors"
								infoButton={
									<InfoButton infoText="Forward reads with number of expected errors higher than this value will be discarded." />
								}
								ErrorMessageComponent={ErrorMessage}
							/>
							<TextField
								register={register}
								errors={errors}
								name="dada2pe_max_ee_r"
								label="Reverse Max Expected Errors"
								infoButton={
									<InfoButton infoText="Reverse reads with number of expected errors higher than this value will be discarded." />
								}
								ErrorMessageComponent={ErrorMessage}
							/>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2pe_trunc_q"
									label="Truncation Quality Threshold"
									infoButton={
										<InfoButton infoText="Reads are truncated at the first instance of a quality score less than or equal to this value. If the resulting read is then shorter than `trunc-len-f` or `trunc-len-r` (depending on the direction of the read) it is discarded." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="p-1 flex justify-center w-full">
							<label className="form-control w-1/2">
								<div className="label pb-0">
									<span className="label-text">Pooling Method</span>
									<span className="label-text-alt">
										<InfoButton infoText="The method used to pool samples for denoising. 'independent': Samples are denoised indpendently. 'pseudo': The pseudo-pooling method is used to approximate pooling of samples. In short, samples are denoised independently once, ASVs detected in at least 2 samples are recorded, and samples are denoised independently a second time, but this time with prior knowledge of the recorded ASVs and thus higher sensitivity to those ASVs." />
									</span>
								</div>
								<select
									{...register("dada2pe_pooling_method")}
									className={`select select-bordered bg-neutral-content w-full ${
										errors.dada2pe_pooling_method && "select-error"
									}`}
								>
									<option disabled value="">
										Select Pooling Method
									</option>
									<option value="independent">Independent</option>
									<option value="pseudo">Pseudo</option>
								</select>
							</label>
						</div>
						<div className="p-1 flex justify-center w-full">
							<label className="form-control w-1/2">
								<div className="label pb-0">
									<span className="label-text">Chimera Method</span>
									<span className="label-text-alt">
										<InfoButton infoText="The method used to remove chimeras. 'none': No chimera removal is performed. 'pooled': All reads are pooled prior to chimera detection. 'consensus': Chimeras are detected in samples individually, and sequences found chimeric in a sufficient fraction of samples are removed." />
									</span>
								</div>
								<select
									{...register("dada2pe_chimera_method")}
									className={`select select-bordered bg-neutral-content w-full ${
										errors.dada2pe_pooling_method && "select-error"
									}`}
								>
									<option disabled value="">
										Select Chimera Method
									</option>
									<option value="consensus">Consensus</option>
									<option value="none">None</option>
									<option value="pooled">Pooled</option>
								</select>
							</label>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2pe_min_fold_parent_over_abundance"
									label="Minimum Fold Parent Over Abundance"
									infoButton={
										<InfoButton infoText="The minimum abundance of potential parents of a sequence being tested as chimeric, expressed as a fold-change versus the abundance of the sequence being tested. Values should be greater than or equal to 1 (i.e. parents should be more abundant than the sequence being tested). This parameter has no effect if chimera-method is 'none'." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2pe_n_reads_learn"
									label="Number of Reads to Learn"
									infoButton={
										<InfoButton infoText="The number of reads to use when training the error model. Smaller numbers will result in a shorter run time but a less reliable error model." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
					</>
				);

			case "DADA2 single-end":
				return (
					<>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2se_trunc_len"
									label="Truncation Length"
									infoButton={
										<InfoButton infoText="Position at which sequences should be truncated due to decrease in quality. This truncates the 3' end of the of the input sequences, which will be the bases that were sequenced in the last cycles. Reads that are shorter than this value will be discarded. If 0 is provided, no truncation or length filtering will be performed." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2se_trim_left"
									label="Trim Left"
									infoButton={
										<InfoButton infoText="Position at which sequences should be trimmed due to low quality. This trims the 5' end of the of the input sequences, which will be the bases that were sequenced in the first cycles." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2se_max_ee"
									label="Max Expected Errors"
									infoButton={
										<InfoButton infoText="Reads with number of expected errors higher than this value will be discarded." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2se_trunc_q"
									label="Truncation Quality Threshold"
									infoButton={
										<InfoButton infoText="Reads are truncated at the first instance of a quality score less than or equal to this value. If the resulting read is then shorter than 'Truncation Length', it is discarded." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="p-1 flex justify-center w-full">
							<label className="form-control w-3/4">
								<div className="label pb-0">
									<span className="label-text">Pooling Method</span>
									<span className="label-text-alt">
										<InfoButton infoText="The method used to pool samples for denoising. 'independent': Samples are denoised independently. 'pseudo': The pseudo-pooling method is used to approximate pooling of samples. In short, samples are denoised independently once, ASVs detected in at least 2 samples are recorded, and samples are denoised independently a second time, but this time with prior knowledge of the recorded ASVs and thus higher sensitivity to those ASVs." />
									</span>
								</div>
								<select
									{...register("dada2se_pooling_method")}
									className={`select select-bordered bg-neutral-content w-full ${
										errors.dada2se_pooling_method && "select-error"
									}`}
								>
									<option disabled value="">
										Select Pooling Method
									</option>
									<option value="independent">Independent</option>
									<option value="pseudo">Pseudo</option>
								</select>
							</label>
						</div>
						<div className="p-1 flex justify-center w-full">
							<label className="form-control w-3/4">
								<div className="label pb-0">
									<span className="label-text">Chimera Method</span>
									<span className="label-text-alt">
										<InfoButton infoText="The method used to remove chimeras. 'none': No chimera removal is performed. 'pooled': All reads are pooled prior to chimera detection. 'consensus': Chimeras are detected in samples individually, and sequences found chimeric in a sufficient fraction of samples are removed." />
									</span>
								</div>
								<select
									{...register("dada2se_chimera_method")}
									className={`select select-bordered bg-neutral-content w-full ${
										errors.dada2se_chimera_method && "select-error"
									}`}
								>
									<option disabled value="">
										Select Chimera Method
									</option>
									<option value="consensus">Consensus</option>
									<option value="none">None</option>
									<option value="pooled">Pooled</option>
								</select>
							</label>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2se_min_fold_parent_over_abundance"
									label="Minimum Fold Parent Over Abundance"
									infoButton={
										<InfoButton infoText="The minimum abundance of potential parents of a sequence being tested as chimeric, expressed as a fold-change versus the abundance of the sequence being tested. Values should be greater than or equal to 1 (i.e. parents should be more abundant than the sequence being tested). This parameter has no effect if chimera-method is 'none'." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="dada2se_n_reads_learn"
									label="Number of Reads to Learn"
									infoButton={
										<InfoButton infoText="The number of reads to use when training the error model. Smaller numbers will result in a shorter run time but a less reliable error model." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
					</>
				);

			case "Deblur single-end":
				return (
					<>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="deblur_trim_length"
									label="Trim Length"
									infoButton={<InfoButton infoText="Sequence trim length, specify -1 to disable trimming." />}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="p-1 flex justify-center w-full">
							<label className="form-control w-3/4">
								<div className="label pb-0">
									<span className="label-text">Deblur Sample Stats</span>
									<span className="label-text-alt">
										<InfoButton infoText="If true, gather stats per sample." />
									</span>
								</div>
								<select
									{...register("deblur_sample_stats")}
									className={`select select-bordered bg-neutral-content w-full ${
										errors.deblur_sample_stats && "select-error"
									}`}
								>
									<option disabled value="">
										Optional sample stats election
									</option>
									<option value="--p-sample-stats">--p-sample-stats</option>
									<option value="--p-no-sample-stats">--p-no-sample-stats</option>
								</select>
							</label>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="deblur_mean_error"
									label="Mean Error"
									infoButton={
										<InfoButton infoText="The mean per nucleotide error, used for original sequence estimate." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="deblur_indel_prob"
									label="Indel Probability"
									infoButton={<InfoButton infoText="Insertion/deletion (indel) probability (same for N indels)." />}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="deblur_indel_max"
									label="Indel Max"
									infoButton={<InfoButton infoText="Maximum number of insertion/deletions." />}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="deblur_min_reads"
									label="Minimum Reads"
									infoButton={
										<InfoButton infoText="Retain only features appearing at least min-reads times across all samples in the resulting feature table." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
						<div className="flex justify-center w-full">
							<div className="w-1/2">
								<TextField
									register={register}
									errors={errors}
									name="deblur_min_size"
									label="Minimum Size"
									infoButton={
										<InfoButton infoText="In each sample, discard all features with an abundance less than min-size." />
									}
									ErrorMessageComponent={ErrorMessage}
								/>
							</div>
						</div>
					</>
				);

			default:
				return null;
		}
	}

	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Denoise Method</h1>
			</div>
			<div className="p-1 flex justify-center w-full">
				<select
					{...register("denoiseMethod")}
					// className="appearance-none bg-white border border-gray-300 w-full py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
					className={`select select-bordered bg-neutral-content w-full max-w-xs ${
						errors.denoiseMethod && "select-error"
					}`}
				>
					<option value="DADA2 paired-end">DADA2 paired-end</option>
					<option value="DADA2 single-end">DADA2 single-end</option>
					<option value="Deblur single-end">Deblur single-end</option>
				</select>
			</div>

			{/* Conditionally render fields based on denoiseMethod */}
			{renderDenoiseFields()}

			<div className="label">
				<span className="label-text-alt"></span>
				<span className="label-text-alt text-red-500">{errors.denoiseMethod && "Please select a denoise method"}</span>
			</div>
		</div>
	);
}
