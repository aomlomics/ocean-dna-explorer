import { ReactNode } from "react";
import AdminTabs from "@/app/components/admin/AdminTabs";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "Admin Dashboard",
		template: "%s | ODE Admin"
	}
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
	const { sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!role || !RolePermissions[role].includes("manageUsers")) {
		notFound();
	}

	return (
		<div>
			<AdminTabs />
			<div className="border border-primary rounded-lg rounded-tl-none p-4">{children}</div>
		</div>
	);
}
