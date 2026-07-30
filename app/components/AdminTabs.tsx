"use client";

import { RolePermissions } from "@/types/objects";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminTabs() {
	const pathname = usePathname();
	const { userId, sessionClaims } = useAuth();
	const role = sessionClaims?.metadata?.role;

	return (
		<nav className="flex">
			<Link
				href="/admin/users"
				className={`btn px-6 py-3 transition-colors rounded-none ${
					pathname === "/admin/users" ? "rounded-t-lg btn-primary" : ""
				}`}
			>
				Manage Users
			</Link>

			<Link
				href="/admin/tour"
				className={`btn px-6 py-3 transition-colors rounded-none ${
					pathname === "/admin/tour" ? "rounded-t-lg btn-primary" : ""
				}`}
			>
				Tour
			</Link>

			{userId && role && RolePermissions[role].includes("manageDatabase") && (
				<>
					<Link
						href="/admin/tags"
						className={`btn px-6 py-3 transition-colors rounded-none ${
							pathname === "/admin/tags" ? "rounded-t-lg btn-primary" : ""
						}`}
					>
						Tags
					</Link>
					<Link
						href="/admin/images"
						className={`btn px-6 py-3 transition-colors rounded-none ${
							pathname === "/admin/images" ? "rounded-t-lg btn-primary" : ""
						}`}
					>
						Home Carousel Images
					</Link>
					<Link
						href="/admin/tools"
						className={`btn px-6 py-3 transition-colors rounded-none ${
							pathname === "/admin/tools" ? "rounded-t-lg btn-primary" : ""
						}`}
					>
						Database Tools
					</Link>
					<Link
						href="/admin/console"
						className={`btn px-6 py-3 transition-colors rounded-none ${
							pathname === "/admin/console" ? "rounded-t-lg btn-primary" : ""
						}`}
					>
						Prisma Console
					</Link>
				</>
			)}
		</nav>
	);
}
