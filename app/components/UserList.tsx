"use client";

import { Role } from "@/types/globals";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getUserListAction } from "../actions/getUserList";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";

export default function UserList() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [users, setUsers] = useState([] as any[]);
	const [error, setError] = useState("");

	const handleSearch = useDebouncedCallback((search) => {
		if (search) {
			router.replace(pathname + "?search=" + search);
		} else {
			router.replace(pathname);
		}
	}, 300);

	useEffect(() => {
		async function getUserList() {
			const response = await getUserListAction(searchParams.get("search") || "");
			if (response.statusMessage === "error") {
				setError(response.error);
			} else {
				setUsers(response.result);
			}
		}

		getUserList();
	}, [searchParams]);

	if (error) {
		return <>{error}</>;
	}

	return (
		<div className="flex flex-col gap-5 border-r-3 pr-10 py-5 rounded-lg border-primary">
			<fieldset className="fieldset">
				<legend className="fieldset-legend">Search for users</legend>
				<input
					type="text"
					name="search"
					className="input"
					placeholder="Search"
					defaultValue={searchParams.get("search") || ""}
					onChange={(e) => {
						handleSearch(e.target.value);
					}}
				/>
			</fieldset>

			<div className="flex flex-col gap-2 overflow-y-auto h-[50vh] pr-5">
				{users.map((user: any) => (
					<Link
						key={user.id}
						href={`/admin/${user.id}`}
						className="border-2 border-base-300 rounded-lg hover:bg-base-300 p-3"
					>
						<div className="font-bold border-b-2 mb-2">
							{user.firstName} {user.lastName}
						</div>
						<div className="grid grid-cols-[auto_1fr] gap-x-2 ">
							<div className="text-primary">Email:</div>
							<div>{user.primaryEmailAddress}</div>

							<div className="text-primary">Role:</div>
							<div>{(user.publicMetadata.role as Role) || "No role"}</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
