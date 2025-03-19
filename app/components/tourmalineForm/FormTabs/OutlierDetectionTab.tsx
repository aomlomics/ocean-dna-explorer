import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";
import ErrorMessage from "@/app/components/tourmalineForm/ErrorMessage";
import TextField from "@/app/components/tourmalineForm/TextField";

export default function OutlierDetectionTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Outlier Detection</h1>
			</div>
			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Distance Metric</span>
						<span className="label-text-alt">
							<InfoButton infoText="Indicating the type of distance metric to be computed." />
						</span>
					</div>
					<select
						{...register("odseq_distance_metric")}
						className={`select select-bordered bg-neutral-content w-full ${
							errors.odseq_distance_metric && "select-error"
						}`}
					>
						<option value="" disabled selected>
							Select Distance Metric
						</option>
						<option value="linear">Linear</option>
						<option value="affine">Affine</option>
					</select>
				</label>
			</div>

			<div className="flex justify-center w-full">
				<div className="w-3/4">
					<TextField
						register={register}
						errors={errors}
						name="odseq_bootstrap_replicates"
						label="Bootstrap Replicates"
						infoButton={
							<InfoButton infoText="The number of bootstrap replicates to be run. The higher the more robust the detection should be." />
						}
						ErrorMessageComponent={ErrorMessage}
					/>
				</div>
			</div>

			<div className="flex justify-center w-full">
				<div className="w-3/4">
					<TextField
						register={register}
						errors={errors}
						name="odseq_threshold"
						label="Threshold"
						infoButton={
							<InfoButton infoText="The probability to be left at the right of the bootstrap scores distribution when computing outliers. This parameter may need some tuning depending on each specific problem." />
						}
						ErrorMessageComponent={ErrorMessage}
					/>
				</div>
			</div>
		</div>
	);
}
