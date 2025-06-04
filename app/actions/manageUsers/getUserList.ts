"use server";

import { NetworkPacket } from "@/types/globals";
import { clerkClient } from "@clerk/nextjs/server";

export async function getUserListAction(query: string): Promise<NetworkPacket> {
	const client = await clerkClient();

	const users = query ? (await client.users.getUserList({ query })).data : (await client.users.getUserList()).data;

	return {
		statusMessage: "success",
		result: users.map((u) => ({
			id: u.id,
			publicMetadata: u.publicMetadata,
			firstName: u.firstName,
			lastName: u.lastName,
			primaryEmailAddress: u.emailAddresses.find((email: any) => email.id === u.primaryEmailAddressId)?.emailAddress
		}))
	};
}
