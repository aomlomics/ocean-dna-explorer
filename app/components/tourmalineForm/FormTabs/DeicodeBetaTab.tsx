import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";
import ErrorMessage from "@/app/components/tourmalineForm/ErrorMessage";
import TextField from "@/app/components/tourmalineForm/TextField";

export default function DeicodeBetaTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Deicode Beta Diversity</h1>
			</div>
			<div className="flex justify-center w-full">
				<div className="w-3/4">
					<TextField
						register={register}
						errors={errors}
						name="deicode_min_sample_count"
						label="Minimum Sample Count"
						infoButton={
							<InfoButton infoText="Minimum sum cutoff of sample across all features. The value can be at minimum zero and must be an whole integer. It is suggested to be greater than or equal to 500." />
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
						name="deicode_min_feature_count"
						label="Minimum Feature Count"
						infoButton={
							<InfoButton infoText="Minimum sum cutoff of features across all samples. The value can be at minimum zero and must be an whole integer." />
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
						name="deicode_min_feature_frequency"
						label="Minimum Feature Frequency"
						infoButton={
							<InfoButton infoText="Minimum percentage of samples a feature must appear with a value greater than zero. This value can range from 0 to 100 with decimal values allowed." />
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
						name="deicode_max_iterations"
						label="Maximum Iterations"
						infoButton={
							<InfoButton infoText="The number of iterations to optimize the solution (suggested to be below 100; beware of overfitting)." />
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
						name="deicode_max_iterations"
						label="Maximum Iterations"
						infoButton={
							<InfoButton infoText="The number of iterations to optimize the solution (suggested to be below 100; beware of overfitting)." />
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
						name="deicode_num_features"
						label="Number of Features"
						infoButton={
							<InfoButton infoText="Number of most important features (arrows) to display in the biplot ordination." />
						}
						ErrorMessageComponent={ErrorMessage}
					/>
				</div>
			</div>
		</div>
	);
}
