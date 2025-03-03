import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";

// Filtering step will be significantly different once we decide how to implement it
export default function FilteringTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Filtering</h1>
			</div>
			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Filtering Selection</span>
						<span className="label-text-alt">
							<InfoButton infoText="More information about Filtering Selection" />
						</span>
					</div>
					<select
						{...register("filtering_election")}
						className={`select select-bordered bg-neutral-content w-full ${
							errors.filtering_election && "select-error"
						}`}
					>
						<option value="" disabled selected>
							Select Filtering Selection
						</option>
						<option value="unfiltered">Unfiltered</option>
						<option value="filtered">Both: Filtered and Unfiltered</option>
					</select>
				</label>
			</div>
		</div>
	);
}
