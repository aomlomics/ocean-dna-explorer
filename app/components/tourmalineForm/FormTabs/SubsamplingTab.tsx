import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";
import ErrorMessage from "@/app/components/tourmalineForm/ErrorMessage";
import TextField from "@/app/components/tourmalineForm/TextField";

export default function SubsamplingTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Subsampling (Rarefaction)</h1>
			</div>
			<div className="flex justify-center w-full">
				<div className="w-3/4">
					<TextField
						register={register}
						errors={errors}
						name="core_sampling_depth"
						label="Core Sampling Depth"
						infoButton={<InfoButton infoText="Subsampling depth for core diversity analyses." />}
						ErrorMessageComponent={ErrorMessage}
					/>
				</div>
			</div>

			<div className="flex justify-center w-full">
				<div className="w-3/4">
					<TextField
						register={register}
						errors={errors}
						name="alpha_max_depth"
						label="Alpha Max Depth"
						infoButton={<InfoButton infoText="Maximum subsampling depth for alpha diversity rarefaction analysis." />}
						ErrorMessageComponent={ErrorMessage}
					/>
				</div>
			</div>
		</div>
	);
}
