import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Manage Users"
};

export default function AdminUsers() {
	return <div className="text-4xl text-primary">Select a user</div>;
}
