import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";
import { clerkClient, User } from "@clerk/nextjs/server";

export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	const client = await clerkClient();

	const { searchParams } = new URL(request.url);

	const responseFields = ["id", "publicMetadata", "firstName", "lastName", "banned", "imageUrl"] as (keyof User)[];
	function getUsersResult(users: User[]) {
		return users.map((u) => {
			const obj = {} as Record<string, any>;

			for (let field of responseFields) {
				obj[field] = u[field];
			}

			obj.primaryEmailAddress = u.emailAddresses.find(
				(email: any) => email.id === u.primaryEmailAddressId
			)?.emailAddress;

			return obj;
		});
	}

	const query = searchParams.get("query");
	if (query) {
		const users = (await client.users.getUserList({ query })).data;

		return NextResponse.json({
			statusMessage: "success",
			result: getUsersResult(users)
		});
	}

	const ids = searchParams.get("userIds");
	if (ids) {
		const userId = ids.split(",");
		const users = (await client.users.getUserList({ userId })).data;

		return NextResponse.json({
			statusMessage: "success",
			result: getUsersResult(users)
		});
	}

	const users = (await client.users.getUserList()).data;
	return NextResponse.json({
		statusMessage: "success",
		result: getUsersResult(users)
	});
}
