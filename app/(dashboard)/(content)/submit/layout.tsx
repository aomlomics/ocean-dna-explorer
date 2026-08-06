import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RolePermissions } from "@/types/objects";

export default async function SubmitLayout({ children }: { children: ReactNode }) {
	const { sessionClaims } = await auth.protect();
	const role = sessionClaims?.metadata.role;

	if (!role || !RolePermissions[role].includes("contribute")) {
		redirect("/contribute");
	}

	return children;
}
