import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { RolePermissions } from "@/types/objects";

export default async function AdminDatabaseLayout({ children }: { children: ReactNode }) {
	const { sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!role || !RolePermissions[role].includes("manageDatabase")) {
		notFound();
	}

	return children;
}
