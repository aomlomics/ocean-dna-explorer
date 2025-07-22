import { ReactNode } from "react";
import UserList from "@/app/components/UserList";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<div className="tabs tabs-lift tabs-xl">
			<input type="radio" name="my_tabs_3" className="tab" aria-label="Manage Users" defaultChecked />
			<div className="tab-content bg-base-100 border-base-300 p-6">
				<div className="grow flex flex-col">
					<h1 className="text-4xl font-semibold text-primary mb-2">Manage Users</h1>
					<div className="flex gap-10 grow">
						<UserList />

						{children}
					</div>
				</div>
			</div>

			<input type="radio" name="my_tabs_3" className="tab" aria-label="Manage Submissions" />
			<div className="tab-content bg-base-100 border-base-300 p-6">
				<div>
					<h1 className="text-4xl font-semibold text-primary mb-2">Manage Submissions</h1>
				</div>
			</div>
		</div>
	);
}
