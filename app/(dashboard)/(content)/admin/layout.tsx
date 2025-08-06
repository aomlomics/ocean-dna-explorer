import { ReactNode } from "react";
import UserList from "@/app/components/UserList";
import PrismaConsole from "@/app/components/PrismaConsole";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { prisma } from "@/app/helpers/prisma";
import migrationCopyStepAction from "@/app/actions/migrationCopyStep";
import WarningButton from "@/app/components/WarningButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	return (
		<div className="tabs tabs-lift tabs-xl">
			<input type="radio" name="my_tabs_3" className="tab" aria-label="Manage Users" defaultChecked />
			<div className="tab-content bg-base-100 border-base-300 p-6">
				<div className="grow flex flex-col">
					<h1 className="text-4xl font-semibold text-primary mb-2">Manage Users</h1>
					<div className="flex gap-10 grow">
						<UserList />

						{children}
					</div>
				</div>
			</div>

			<input type="radio" name="my_tabs_3" className="tab" aria-label="Manage Submissions" />
			<div className="tab-content bg-base-100 border-base-300 p-6">
				<h1 className="text-4xl font-semibold text-primary mb-2">Manage Submissions</h1>
			</div>

			{userId && role && RolePermissions[role].includes("manageDatabase") && (
				<>
					<input type="radio" name="my_tabs_3" className="tab" aria-label="Prisma Console" />
					<div className="tab-content bg-base-100 border-base-300 p-6">
						<PrismaConsole modelQueries={Object.keys(prisma.project)} />
					</div>

					<input type="radio" name="my_tabs_3" className="tab" aria-label="Migration Copy Step" />
					<div className="tab-content bg-base-100 border-base-300 p-6">
						<h1 className="text-4xl font-semibold text-primary mb-2">Migration Copy Step</h1>
						<WarningButton
							buttonText="Apply Migration Copy Step"
							warningText="This will take all fields that end with __TEMP and copy their corresponding fields' values into them."
							confirmText="apply"
							action={migrationCopyStepAction}
						/>
					</div>
				</>
			)}
		</div>
	);
}
