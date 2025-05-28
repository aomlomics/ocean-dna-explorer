import analysisDeleteAction from "@/app/actions/analysis/analysisDelete";
import { banUserAction, deleteUserAction, removeRoleAction, setRoleAction } from "@/app/actions/manageUsers/editUser";
import SubmissionDeleteButton from "@/app/components/SubmissionDeleteButton";
import WarningButton from "@/app/components/WarningButton";
import { prisma } from "@/app/helpers/prisma";
import { Role } from "@/types/globals";
import { RoleHeirarchy } from "@/types/objects";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UserId({ params }: { params: Promise<{ targetUserId: string }> }) {
	const { targetUserId } = await params;

	const { userId, sessionClaims } = await auth();
	if (userId === targetUserId) {
		redirect("/admin");
	}
	const role = sessionClaims?.metadata.role as Role;

	const client = await clerkClient();
	let user;
	try {
		user = await client.users.getUser(targetUserId);
	} catch {
		return <>Error: User not found</>;
	}

	const uneditable = !RoleHeirarchy[role].includes(user.publicMetadata.role as Role);

	const [projects, analyses] = await prisma.$transaction([
		prisma.project.findMany({
			where: {
				userIds: {
					has: targetUserId
				}
			}
		}),
		prisma.analysis.findMany({
			where: {
				userIds: {
					has: targetUserId
				}
			}
		})
	]);

	return (
		<div className="grow flex flex-col gap-5">
			<header className="flex gap-5 items-center justify-between">
				<div>
					<p className="text-2xl text-primary">
						{user.firstName} {user.lastName}
					</p>
					<p className="text-lg text-base-content/70">
						{user.emailAddresses.find((email: any) => email.id === user.primaryEmailAddressId)?.emailAddress}
					</p>
				</div>

				<div className="flex gap-5">
					<WarningButton
						value={user.id}
						buttonText="Delete User"
						warningText="This will permanently delete the user and all of their submissions."
						action={deleteUserAction}
						redirectUrl="/admin"
						disabled={uneditable}
					/>

					{/* TODO: test banning user */}
					<WarningButton
						value={user.id}
						buttonText="Ban User"
						warningText="This will prevent the user from being able to log in. They may be unbanned in the future, and their submissions will remain."
						action={banUserAction}
						redirectUrl="/admin"
						disabled={uneditable}
					/>
				</div>
			</header>

			<div>
				<div>
					<span className="text-primary">Role:</span> {(user.publicMetadata.role as Role) || "No Role"}{" "}
					{uneditable && <span className="pl-5 text-base-content/50 italic">You may not edit users of this role</span>}
				</div>

				<div className="flex gap-3">
					{role === "admin" && (
						<form action={setRoleAction}>
							<input type="hidden" value={user.id} name="targetUserId" />
							<input type="hidden" value="moderator" name="role" />
							<button type="submit" className="btn" disabled={uneditable}>
								Make Moderator
							</button>
						</form>
					)}

					<form action={setRoleAction}>
						<input type="hidden" value={user.id} name="targetUserId" />
						<input type="hidden" value="contributor" name="role" />
						<button type="submit" className="btn" disabled={uneditable}>
							Make Contributor
						</button>
					</form>

					<form action={removeRoleAction}>
						<input type="hidden" value={user.id} name="targetUserId" />
						<button type="submit" className="btn" disabled={uneditable}>
							Remove Role
						</button>
					</form>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-5">
				<div className="card bg-base-200 shadow-sm min-h-[260px] h-fit hover:shadow-sm transition-shadow overflow-hidden">
					<div className="card-body">
						<div className="w-full h-full flex flex-col relative">
							<h2 className="text-2xl text-primary font-medium mb-4">Projects:</h2>
							<div className="flex flex-col gap-3 mt-2">
								{projects.length ? (
									projects.map((p) => (
										<div key={p.id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
											<Link
												href={`/explore/project/${encodeURIComponent(p.project_id)}`}
												className="text-primary hover:text-info-focus hover:underline transition-colors"
											>
												{p.project_id}
											</Link>
											<div className="flex gap-3">
												<SubmissionDeleteButton
													field="analysis_run_name"
													value={p.project_id}
													action={analysisDeleteAction}
													disabled={uneditable}
												/>
											</div>
										</div>
									))
								) : (
									<>No Projects</>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="card bg-base-200 shadow-sm min-h-[260px] h-fit hover:shadow-sm transition-shadow overflow-hidden">
					<div className="card-body">
						<div className="w-full h-full flex flex-col relative">
							<h2 className="text-2xl text-primary font-medium mb-4">Analyses:</h2>
							<div className="flex flex-col gap-3 mt-2">
								{analyses.length ? (
									analyses.map((a) => (
										<div key={a.id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
											<Link
												href={`/explore/analysis/${encodeURIComponent(a.analysis_run_name)}`}
												className="text-primary hover:text-info-focus hover:underline transition-colors"
											>
												{a.analysis_run_name}
											</Link>
											<div className="flex gap-3">
												<SubmissionDeleteButton
													field="analysis_run_name"
													value={a.analysis_run_name}
													action={analysisDeleteAction}
													disabled={uneditable}
												/>
											</div>
										</div>
									))
								) : (
									<>No Analyses</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
