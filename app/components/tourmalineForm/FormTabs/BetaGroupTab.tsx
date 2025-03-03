import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";
import TextField from "@/app/components/tourmalineForm/TextField";
import ErrorMessage from "@/app/components/tourmalineForm/ErrorMessage";

export default function BetaGroupTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Beta Group Significance</h1>
			</div>
			<div className="flex justify-center w-full">
				<div className="w-3/4">
					<TextField
						register={register}
						errors={errors}
						name="beta_group_column"
						label="Beta Group Column"
						infoButton={
							<InfoButton infoText="Metadata column to test beta group significance; this column must appear in the metadata file." />
						}
						ErrorMessageComponent={ErrorMessage}
					/>
					<label className="label">
						<span className="label-text-alt text-warning bg-secondary rounded-lg p-2 mt-[-10px]">
							Warning: The column name must match the desired column in your metadata file EXACTLY
						</span>
					</label>
				</div>
			</div>

			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Beta Group Method</span>
						<span className="label-text-alt">
							<InfoButton infoText="Choose one of the available methods." />
						</span>
					</div>
					<select
						{...register("beta_group_method")}
						className={`select select-bordered bg-neutral-content w-full ${errors.beta_group_method && "select-error"}`}
					>
						<option value="" disabled selected>
							Select Beta Group Method
						</option>
						<option value="permanova">Permanova</option>
						<option value="anosim">Anosim</option>
						<option value="permdisp">Permdisp</option>
					</select>
				</label>
			</div>

			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Beta Group Pairwise</span>
						<span className="label-text-alt">
							<InfoButton infoText="Choosing '--p-pairwise' can significantly slow down performance speed." />
						</span>
					</div>
					<select
						{...register("beta_group_pairwise")}
						className={`select select-bordered bg-neutral-content w-full ${
							errors.beta_group_pairwise && "select-error"
						}`}
					>
						<option value="" disabled selected>
							Select Beta Group Pairwise
						</option>
						<option value="--p-no-pairwise">No Pairwise (--p-no-pairwise)</option>
						<option value="--p-pairwise">Pairwise (--p-pairwise)</option>
					</select>
				</label>
			</div>
		</div>
	);
}
