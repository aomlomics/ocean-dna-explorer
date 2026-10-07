import UserList from "@/app/components/admin/UserList";
import type { ReactNode } from "react";

export default function AdminUsersLayout({ children }: { children: ReactNode }) {
	return (
		<div className="grow flex flex-col">
			<h1 className="text-4xl font-semibold text-primary mb-2">Manage Users</h1>
			<div className="flex gap-10 grow">
				<UserList />

				{children}
			</div>
		</div>
	);
}
