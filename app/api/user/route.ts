import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";
import { auth, clerkClient, User } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";

function getUsersResult(users: User[], emails?: boolean) {
	return users.map((u) => ({
		id: u.id,
		publicMetadata: u.publicMetadata,
		firstName: u.firstName,
		lastName: u.lastName,
		banned: u.banned,
		imageUrl: u.imageUrl,
		primaryEmailAddress: emails
			? u.emailAddresses.find((email: any) => email.id === u.primaryEmailAddressId)?.emailAddress
			: undefined
	}));
}

export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		return NextResponse.json({
			statusMessage: "error",
			error: "Unauthorized"
		});
	}

	const { searchParams } = new URL(request.url);

	const emails = searchParams.get("emails") === "true" ? true : false;
	const query = searchParams.get("query");
	const ids = searchParams.get("userIds");

	if (emails && !RolePermissions[role].includes("manageUsers")) {
		return NextResponse.json({
			statusMessage: "error",
			error: "Unauthorized"
		});
	}

	const client = await clerkClient();

	let users = [] as User[];
	//TODO: paginate users list
	if (query) {
		users = (await client.users.getUserList({ query, limit: 500 })).data;
	} else if (ids) {
		const userId = ids.split(",");
		users = (await client.users.getUserList({ userId, limit: 500 })).data;
	} else {
		users = (await client.users.getUserList({ limit: 500 })).data;
	}

	return NextResponse.json({
		statusMessage: "success",
		result: getUsersResult(users, emails)
	});
}
