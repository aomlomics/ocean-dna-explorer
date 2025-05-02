import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { checkRole } from "@/app/helpers/utils";
import { SearchUsers } from "@/app/components/SearchUsers";
import { setRole } from "@/app/helpers/actions/adminRoles/setRole";
import { removeRole } from "@/app/helpers/actions/adminRoles/removeRole";

export default async function Admin(params: { searchParams: Promise<{ search?: string }> }) {
	if (!checkRole("admin")) {
		redirect("/");
	}

	const query = (await params.searchParams).search;

	const client = await clerkClient();

	const users = query ? (await client.users.getUserList({ query })).data : [];

	return (
		<>
			<SearchUsers />

			{users.map((user) => {
				return (
					<div key={user.id}>
						<div>
							{user.firstName} {user.lastName}
						</div>

						<div>
							Primary Email:{" "}
							{user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress}
						</div>

						<div>Role: {user.publicMetadata.role as string}</div>

						<form action={setRole}>
							<input type="hidden" value={user.id} name="id" />
							<input type="hidden" value="admin" name="role" />
							<button type="submit" className="btn">
								Make Admin
							</button>
						</form>

						<form action={setRole}>
							<input type="hidden" value={user.id} name="id" />
							<input type="hidden" value="moderator" name="role" />
							<button type="submit" className="btn">
								Make Moderator
							</button>
						</form>

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
			})}
		</>
	);
}
