import { FieldErrors } from "react-hook-form/dist/types/errors";
import InfoButton from "@/app/components/InfoButton";

export default function MetadataTab({ register, errors }: { register: any; errors: FieldErrors<any> }) {
	return (
		<div>
			<div className="text-center my-4">
				<h1 className="text-3xl font-bold text-secondary">Metadata</h1>
			</div>
			<div className="flex justify-center">
				<label className="form-control w-full max-w-xs">
					<div className="label">
						<span className="label-text mb-1">Upload Metadata (.tsv):</span>
						<span className="label-text-alt">
							<InfoButton infoText="Visit the Tourmaline GitHub page for information and an example of an acceptable metadata file. Click 'Tourmaline' above." />
						</span>
					</div>
					<input
						type="file"
						{...register("metadataFile")}
						accept=".tsv"
						className="file-input file-input-bordered file-input-secondary bg-neutral-content w-full max-w-xs"
					/>
				</label>
			</div>
		</div>
	);
}
