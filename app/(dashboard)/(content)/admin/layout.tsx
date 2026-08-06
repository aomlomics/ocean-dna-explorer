import { ReactNode } from "react";
import AdminTabs from "@/app/components/AdminTabs";
import { auth } from "@clerk/nextjs/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
	await auth.protect();

	return (
		<div>
			<AdminTabs />
			<div className="border border-primary rounded-lg rounded-tl-none p-4">{children}</div>
		</div>
	);
}
