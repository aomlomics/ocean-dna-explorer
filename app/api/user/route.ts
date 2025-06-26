import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";
import { clerkClient, User } from "@clerk/nextjs/server";

function getUsersResult(users: User[]) {
	return users.map((u) => ({
		id: u.id,
		publicMetadata: u.publicMetadata,
		firstName: u.firstName,
		lastName: u.lastName,
		banned: u.banned,
		imageUrl: u.imageUrl,
		primaryEmailAddress: u.emailAddresses.find((email: any) => email.id === u.primaryEmailAddressId)?.emailAddress
	}));
}

export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	const client = await clerkClient();

	const { searchParams } = new URL(request.url);

	const query = searchParams.get("query");
	const ids = searchParams.get("userIds");

	let users = [] as User[];
	if (query) {
		users = (await client.users.getUserList({ query })).data;
	} else if (ids) {
		const userId = ids.split(",");
		users = (await client.users.getUserList({ userId })).data;
	} else {
		users = (await client.users.getUserList()).data;
	}

	return NextResponse.json({
		statusMessage: "success",
		result: getUsersResult(users)
	});
}
