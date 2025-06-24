"use client";

import { NetworkPacket, Role } from "@/types/globals";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import { useAuth } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";

export default function UserList() {
	const { userId } = useAuth();
	const [users, setUsers] = useState([] as User[]);
	const [error, setError] = useState("");

	async function searchUsers(query = "") {
		const response = await fetch(`/api/user?query=${query}`);
		if (response.ok) {
			const json = (await response.json()) as NetworkPacket;
			if (json.statusMessage === "success") {
				setUsers(json.result);
			} else if (json.statusMessage === "error") {
				setError(json.error);
			}
		}
	}

	useEffect(() => {
		searchUsers();
	}, []);

	const handleSearch = useDebouncedCallback(searchUsers, 300);

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
					onChange={(e) => {
						handleSearch(e.target.value);
					}}
				/>
			</fieldset>

			<div className="flex flex-col gap-2 overflow-y-auto h-[50vh] pr-5">
				{users.reduce((acc: ReactNode[], user: any) => {
					if (userId !== user.id) {
						acc.push(
							<Link
								key={user.id}
								href={`/admin/${user.id}`}
								className="border-2 border-base-300 rounded-lg hover:bg-base-300 p-3"
							>
								<div className={`font-bold border-b-2 border-base-content mb-2 ${user.banned ? "text-error" : ""}`}>
									{user.firstName} {user.lastName}
								</div>
								<div className="grid grid-cols-[auto_1fr] gap-x-2 ">
									<div className="text-primary">Email:</div>
									<div>{user.primaryEmailAddress}</div>

									<div className="text-primary">Role:</div>
									<div className="flex items-center gap-2">
										{(user.publicMetadata.role as Role) || "No role"}
										{!!user.publicMetadata.roleApplication && (
											<div
												className="tooltip tooltip-warning flex items-center"
												data-tip={`Applied for role: ${user.publicMetadata.roleApplication.role}`}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													className="stroke-current text-warning shrink-0 w-4 h-4"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
													></path>
												</svg>
											</div>
										)}
									</div>
								</div>
							</Link>
						);
					}

					return acc;
				}, [])}
			</div>
		</div>
	);
}
