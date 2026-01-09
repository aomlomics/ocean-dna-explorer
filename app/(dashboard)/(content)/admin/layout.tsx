"use client";

import { ReactNode } from "react";
import { RolePermissions } from "@/types/objects";
import { useAuth } from "@clerk/clerk-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const { userId, sessionClaims } = useAuth();
	const role = sessionClaims?.metadata?.role;

	return (
		<div>
			<nav className="flex">
				<Link
					href="/admin/users"
					className={`btn px-6 py-3 transition-colors rounded-none ${
						pathname === "/admin/users" ? "rounded-t-lg btn-primary" : ""
					}`}
				>
					Manage Users
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
							href="/admin/seed"
							className={`btn px-6 py-3 transition-colors rounded-none ${
								pathname === "/admin/seed" ? "rounded-t-lg btn-primary" : ""
							}`}
						>
							Seed Database
						</Link>
						<Link
							href="/admin/console"
							className={`btn px-6 py-3 transition-colors rounded-none ${
								pathname === "/admin/console" ? "rounded-t-lg btn-primary" : ""
							}`}
						>
							Prisma Console
						</Link>
						<Link
							href="/admin/migration"
							className={`btn px-6 py-3 transition-colors rounded-none ${
								pathname === "/admin/migration" ? "rounded-t-lg btn-primary" : ""
							}`}
						>
							Migration Copy Step
						</Link>
					</>
				)}
			</nav>
			<div className="border border-primary rounded-lg rounded-tl-none p-4">{children}</div>
		</div>
	);
}
