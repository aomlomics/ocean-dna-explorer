"use client";

import { NetworkPacket, TargetAction } from "@/types/globals";
import { User } from "@clerk/nextjs/dist/types/server";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

export default function SubmissionUsersButton({
	userIds,
	action,
	target
}: {
	userIds: string[];
	action: TargetAction;
	target: string;
}) {
	const { userId } = useAuth();
	const modalRef = useRef<HTMLDialogElement>(null);
	const [users, setUsers] = useState([] as User[]);
	const [error, setError] = useState("");

	const [search, setSearch] = useState("");
	const [searchedUsers, setSearchedUsers] = useState([] as User[]);
	const [newUsers, setNewUsers] = useState([] as User[]);
	const [deletedUsers, setDeletedUsers] = useState([] as User[]);

	useEffect(() => {
		async function getCurrentUsers() {
			const response = await fetch(`/api/user?userIds=${userIds.join(",")}`);
			if (response.ok) {
				const json = (await response.json()) as NetworkPacket;
				if (json.statusMessage === "success") {
					setUsers(json.result);
				} else if (json.statusMessage === "error") {
					setError(json.error);
				}
			}
		}

		getCurrentUsers();
	}, []);

	async function searchUsers(query = "") {
		if (query) {
			const response = await fetch(`/api/user?query=${query}`);
			if (response.ok) {
				const json = (await response.json()) as NetworkPacket;
				if (json.statusMessage === "success") {
					setSearchedUsers(json.result);
				} else if (json.statusMessage === "error") {
					setSearchedUsers([]);
					setError(json.error);
				}
			} else {
				setError(response.statusText);
				setSearchedUsers([]);
			}
		} else {
			setSearchedUsers([]);
		}
	}

	const handleSearch = useDebouncedCallback(searchUsers, 300);

	function close() {
		modalRef.current?.close();
		setSearch("");
		setNewUsers([]);
		setDeletedUsers([]);
	}

	async function handleSubmit() {
		if (deletedUsers.length || newUsers.length) {
			const tempUsers = [...users.filter((u) => !deletedUsers.some((nu) => u.id === nu.id)), ...newUsers];
			const newUserIds = tempUsers.map((u) => u.id);

			const result = await action(target, newUserIds);
			if (result.statusMessage === "success") {
				setUsers(tempUsers);
				close();
			}
		}
	}

	if (error) {
		return <>{error}</>;
	}

	function UserDisplay({ user, disabled }: { user: User; disabled?: boolean }) {
		return (
			<>
				<div className={`relative h-[20px] aspect-square ${disabled ? "opacity-25" : ""}`}>
					<Image
						src={user.imageUrl}
						alt={`${user.firstName} ${user.lastName} Profile Picture`}
						fill
						className="object-contain rounded-full"
					/>
				</div>
				<span className={`grow ${disabled ? "opacity-25" : ""}`}>
					{user.firstName} {user.lastName}
				</span>
			</>
		);
	}

	return (
		<>
			<button
				className="btn btn-sm bg-primary text-neutral-content hover:bg-info"
				onClick={() => modalRef.current?.showModal()}
			>
				Users
			</button>
			<dialog ref={modalRef} className="modal">
				<div className="modal-box overflow-y-visible">
					<button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={close}>
						✕
					</button>

					<div>
						<div>Current Users:</div>
						<div className="grid grid-cols-2 gap-2">
							{users.map((u) => (
								<div key={u.id} className="inline-flex items-center gap-2 p-1 border-2 border-primary rounded-lg">
									<UserDisplay user={u} disabled={deletedUsers.some((nu) => u.id === nu.id)} />
									{u.id !== userId &&
										(deletedUsers.some((nu) => u.id === nu.id) ? (
											<button
												className="btn btn-xs h-[20px] w-[20px] btn-circle btn-ghost text-success"
												onClick={() => setDeletedUsers(deletedUsers.filter((nu) => u.id !== nu.id))}
											>
												✓
											</button>
										) : (
											<button
												className="btn btn-xs h-[20px] w-[20px] btn-circle btn-ghost text-red-400"
												onClick={() => setDeletedUsers([...deletedUsers, u])}
											>
												✕
											</button>
										))}
								</div>
							))}
							{newUsers.map((u) => (
								<div key={u.id} className="inline-flex items-center gap-2 p-1 border-2 border-warning rounded-lg">
									<UserDisplay user={u} />
									<button
										className="btn btn-xs h-[20px] w-[20px] btn-circle btn-ghost text-red-400"
										onClick={() => setNewUsers(newUsers.filter((nu) => u.id !== nu.id))}
									>
										✕
									</button>
								</div>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<div className="dropdown">
							<fieldset className="fieldset">
								<legend className="fieldset-legend">Search for users</legend>
								<input
									type="text"
									name="search"
									className="input w-full"
									placeholder="Search"
									autoComplete="off"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										handleSearch(e.target.value);
									}}
								/>
							</fieldset>
							{!!searchedUsers.filter(
								(u) => !users.some((nu) => u.id === nu.id) && !newUsers.some((nu) => u.id === nu.id)
							).length && (
								<ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-box z-1 p-2 shadow-sm w-full">
									{searchedUsers.reduce((acc, u) => {
										if (userId !== u.id && ![...users, ...newUsers].some((nu) => u.id === nu.id)) {
											acc.push(
												<li
													key={u.id}
													onClick={() => {
														setNewUsers([...newUsers, u]);
														setSearch("");
														setSearchedUsers([]);
													}}
												>
													<a>
														<div key={u.id} className="flex items-center gap-2 p-1">
															<UserDisplay user={u} />
														</div>
													</a>
												</li>
											);
										}

										return acc;
									}, [] as ReactNode[])}
								</ul>
							)}
						</div>

						<button className="btn" disabled={!deletedUsers.length && !newUsers.length} onClick={handleSubmit}>
							Update Users
						</button>
					</div>
				</div>
				<form method="dialog" onSubmit={close} className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}
