import { auth, clerkClient } from "@clerk/nextjs/server";
import { SearchUsers } from "@/app/components/SearchUsers";
import { setRole } from "@/app/actions/editRole";
import { removeRole } from "@/app/actions/editRole";
import { Role } from "@/types/globals";
import { ReactNode } from "react";
import { RoleHeirarchy } from "@/types/objects";

export default async function Admin(params: { searchParams: Promise<{ search?: string }> }) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role as Role;

	const query = (await params.searchParams).search;

	const client = await clerkClient();

	const users = query ? (await client.users.getUserList({ query })).data : [];

	return (
		<>
			<SearchUsers />

			{users.reduce((acc: ReactNode[], user) => {
				if (user.id !== userId && RoleHeirarchy[role].includes(user.publicMetadata.role as Role)) {
					acc.push(
						<div key={user.id}>
							<div>
								{user.firstName} {user.lastName}
							</div>

							<div>
								Primary Email:{" "}
								{user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress}
							</div>

							<div>Role: {user.publicMetadata.role as Role}</div>

							{role === "admin" && (
								<form action={setRole}>
									<input type="hidden" value={user.id} name="id" />
									<input type="hidden" value="moderator" name="role" />
									<button type="submit" className="btn">
										Make Moderator
									</button>
								</form>
							)}

							<form action={setRole}>
								<input type="hidden" value={user.id} name="id" />
								<input type="hidden" value="contributor" name="role" />
								<button type="submit" className="btn">
									Make Contributor
								</button>
							</form>

							<form action={removeRole}>
								<input type="hidden" value={user.id} name="id" />
								<button type="submit" className="btn">
									Remove Role
								</button>
							</form>
						</div>
					);
				}

				return acc;
			}, [])}
		</>
	);
}
