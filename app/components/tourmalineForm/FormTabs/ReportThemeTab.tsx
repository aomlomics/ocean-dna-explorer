import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";

export default function ReportThemeTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Report Theme</h1>
			</div>
			<div className="p-1 flex justify-center w-full">
				<label className="form-control w-3/4">
					<div className="label pb-0">
						<span className="label-text">Report Theme</span>
						<span className="label-text-alt">
							<InfoButton infoText="Report theme for your HTML report." />
						</span>
					</div>
					<select
						{...register("report_theme")}
						className={`select select-bordered bg-neutral-content w-full ${errors.report_theme && "select-error"}`}
					>
						<option value="" disabled selected>
							Select Report Theme
						</option>
						<option value="github">Github</option>
						<option value="gothic">Gothic</option>
						<option value="newsprint">Newsprint</option>
						<option value="night">Night</option>
						<option value="pixyll">Pixyll</option>
						<option value="whitey">Whitey</option>
					</select>
				</label>
			</div>
		</div>
	);
}
