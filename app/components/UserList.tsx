"use client";

import { Role } from "@/types/globals";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getUserListAction } from "../actions/manageUsers/getUserList";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";
import { useAuth } from "@clerk/nextjs";

export default function UserList() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [users, setUsers] = useState([] as any[]);
	const [error, setError] = useState("");
	const { userId } = useAuth();

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
