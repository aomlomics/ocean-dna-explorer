import analysisDeleteAction from "@/app/actions/analysis/analysisDelete";
import { removeRoleAction, setRoleAction } from "@/app/actions/editRole";
import SubmissionDeleteButton from "@/app/components/SubmissionDeleteButton";
import { prisma } from "@/app/helpers/prisma";
import { Role } from "@/types/globals";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function UserId({ params }: { params: Promise<{ userId: string }> }) {
	const { userId } = await params;

	const { sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role as Role;

	const client = await clerkClient();
	let user;
	try {
		user = await client.users.getUser(userId);
	} catch {
		return <>Error: User not found</>;
	}

	const [projects, analyses] = await prisma.$transaction([
		prisma.project.findMany({
			where: {
				userIds: {
					has: userId
				}
			}
		}),
		prisma.analysis.findMany({
			where: {
				userIds: {
					has: userId
				}
			}
		})
	]);

	return (
		<div className="grow flex flex-col gap-5">
			<header>
				<p className="text-2xl text-primary">
					{user.firstName} {user.lastName}
				</p>
				<p className="text-lg text-base-content/70">
					{user.emailAddresses.find((email: any) => email.id === user.primaryEmailAddressId)?.emailAddress}
				</p>
			</header>

			<div>
				<div>
					<span className="text-primary">Role:</span> {(user.publicMetadata.role as Role) || "No Role"}
				</div>

				<div className="flex gap-3">
					{role === "admin" && (
						<form action={setRoleAction}>
							<input type="hidden" value={user.id} name="id" />
							<input type="hidden" value="moderator" name="role" />
							<button type="submit" className="btn">
								Make Moderator
							</button>
						</form>
					)}

					<form action={setRoleAction}>
						<input type="hidden" value={user.id} name="id" />
						<input type="hidden" value="contributor" name="role" />
						<button type="submit" className="btn">
							Make Contributor
						</button>
					</form>

					<form action={removeRoleAction}>
						<input type="hidden" value={user.id} name="id" />
						<button type="submit" className="btn">
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
