import migrationCopyStepAction from "@/app/actions/migrationCopyStep";
import remakeBlastDatabaseAction from "@/app/actions/remakeBlastDatabase";
import seedDatabaseAction from "@/app/actions/seedDatabase";
import WarningButton from "@/app/components/admin/WarningButton";
import { prisma } from "@/app/helpers/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Database Tools"
};

export default async function AdminTools() {
	const assaysInUse = await prisma.assay.findMany({
		where: {
			Analyses: {
				some: {}
			}
		},
		select: {
			assay_name: true
		}
	});

	return (
		<div className="flex flex-col gap-10">
			<div>
				<h1 className="text-4xl font-semibold text-primary mb-2">Seed Database</h1>
				<form action={seedDatabaseAction}>
					<button className="btn btn-warning">Seed Database</button>
				</form>
			</div>

			<div className="flex flex-col gap-3">
				<h1 className="text-4xl font-semibold text-primary mb-2">Remake BLAST Databases</h1>
				<form className="flex gap-5" action={remakeBlastDatabaseAction}>
					<select name="database" className="select" defaultValue={""} required>
						<option value="" disabled>
							Select database
						</option>
						<option value="all">All</option>
						{assaysInUse.map((a) => (
							<option key={a.assay_name}>{a.assay_name}</option>
						))}
					</select>
					<button className="btn btn-primary">Remake Selected Database</button>
				</form>
				<form action={remakeBlastDatabaseAction}>
					<button className="btn btn-warning">Remake Every Database</button>
				</form>
			</div>

			<div>
				<h1 className="text-4xl font-semibold text-primary mb-2">Migration Copy Step</h1>
				<WarningButton
					buttonText="Apply Migration Copy Step"
					warningText="This will take all fields that end with __TEMP and copy their corresponding fields' values into them."
					confirmText="apply"
					action={migrationCopyStepAction}
				/>
			</div>
		</div>
	);
}
