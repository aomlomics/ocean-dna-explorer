import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";
import TextField from "@/app/components/tourmalineForm/TextField";
import ErrorMessage from "@/app/components/tourmalineForm/ErrorMessage";

export default function MsaTab({
	register,
	errors,
	selectedMsaMethod
}: {
	register: any;
	errors: FieldErrors<any>;
	selectedMsaMethod: "muscle" | "clustalo" | "mafft";
}) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Multiple Sequence Alignment</h1>
			</div>
			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Multiple Sequence Alignment Method</span>
						<span className="label-text-alt">
							<InfoButton infoText="'Muscle': https://drive5.com/muscle/    'Clustal Omega': http://www.clustal.org    'Mafft': Perform de novo multiple sequence alignment using MAFFT." />
						</span>
					</div>
					<select
						{...register("msaMethod")}
						className={`select select-bordered bg-neutral-content w-full ${errors.msaMethod && "select-error"}`}
					>
						<option value="" disabled selected>
							Select Alignment Method
						</option>
						<option value="muscle">Muscle</option>
						<option value="clustalo">Clustal Omega</option>
						<option value="mafft">MAFFT</option>
					</select>
				</label>
			</div>

			{selectedMsaMethod === "muscle" && (
				<div className="flex justify-center w-full">
					<div className="w-3/4">
						<TextField
							register={register}
							errors={errors}
							name="muscle_iters"
							label="Minimum Fold Parent Over Abundance"
							infoButton={<InfoButton infoText="Number of refinement iterations." />}
							ErrorMessageComponent={ErrorMessage}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
