"use server";

import { Role } from "@/types/globals";
import { Roles } from "@/types/objects";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const formSchema = z.object({
	description: z.string().optional()
});

export default async function roleApplicationAction(role: Role, formData: FormData) {
	const client = await clerkClient();

	const { userId } = await auth();
	if (!userId) {
		throw new Error("Must be logged in to apply for a role.");
	}

	if (!Roles.includes(role)) {
		throw new Error("Invalid role.");
	}

	if (!(formData instanceof FormData)) {
		throw new Error("Argument must be FormData.");
	}
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = formSchema.safeParse(formDataObject);
	if (!parsed.success) {
		console.log(parsed.error.message);
		throw new Error(
			parsed.error.issues
				? parsed.error.issues.map((issue) => `${issue.path[0]}: ${issue.message}`).join(" ")
				: "Invalid data structure."
		);
	}

	await client.users.updateUserMetadata(userId, {
		publicMetadata: { roleApplication: role }
	});

	//TODO: send email to all admins/moderators/people who have enabled email notifications in admin dashboard
}
