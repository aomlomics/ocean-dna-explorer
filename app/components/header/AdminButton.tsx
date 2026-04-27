"use client";

import { RolePermissions } from "@/types/objects";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function AdminButton() {
	const { sessionClaims } = useAuth();
	const role = sessionClaims?.metadata.role;

	if (!role || !RolePermissions[role].includes("manageUsers")) {
		return <></>;
	}

	return (
		<Link href="/admin" className="btn hidden sm:inline-flex">
			Admin
		</Link>
	);
}
