import migrationCopyStepAction from "@/app/actions/migrationCopyStep";
import WarningButton from "@/app/components/WarningButton";

export default function AdminMigration() {
	return (
		<>
			<h1 className="text-4xl font-semibold text-primary mb-2">Migration Copy Step</h1>
			<WarningButton
				buttonText="Apply Migration Copy Step"
				warningText="This will take all fields that end with __TEMP and copy their corresponding fields' values into them."
				confirmText="apply"
				action={migrationCopyStepAction}
			/>
		</>
	);
}
