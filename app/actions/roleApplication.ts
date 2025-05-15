"use server";

import { NetworkPacket, Role } from "@/types/globals";
import { Roles } from "@/types/objects";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function roleApplicationAction(role: Role, description?: string): Promise<NetworkPacket> {
	const client = await clerkClient();

	const { userId } = await auth();
	if (!userId) {
		return { statusMessage: "error", error: "Must be logged in to apply for a role." };
	}

	if (!Roles.includes(role)) {
		return { statusMessage: "error", error: "Invalid role." };
	}

	if (description && typeof description !== "string") {
		return { statusMessage: "error", error: "Description must be string." };
	}

	await client.users.updateUserMetadata(userId, {
		publicMetadata: { roleApplication: { role, description } }
	});

	//TODO: send email to all admins/moderators/people who have enabled email notifications in admin dashboard

	return { statusMessage: "success" };
}
