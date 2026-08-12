"use client";

import { ClerkUserObject, NetworkPacket, TargetAction } from "@/types/globals";
import { useAuth } from "@clerk/nextjs";
import { Dispatch, MouseEventHandler, ReactNode, SetStateAction, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import Image from "next/image";

export default function UserAdder({
	disabled,
	submittable,
	userIds,
	setUserIds,
	submitAction,
	target,
	afterSubmit,
	cols = 2
}: { disabled?: boolean; userIds: string[]; afterSubmit?: () => void; cols?: number } & (
	| {
			submittable?: false;
			setUserIds: Dispatch<SetStateAction<string[]>>;
			submitAction?: undefined;
			target?: undefined;
	  }
	| {
			submittable: true;
			setUserIds?: undefined;
			submitAction: TargetAction;
			target: string;
	  }
)) {
	const { userId } = useAuth();

	const [users, setUsers] = useState([] as ClerkUserObject[]);

	const [loadingError, setLoadingError] = useState("");
	const [submitError, setSubmitError] = useState("");

	const [search, setSearch] = useState("");
	const [searchedUsers, setSearchedUsers] = useState([] as ClerkUserObject[]);
	const [newUsers, setNewUsers] = useState([] as ClerkUserObject[]);
	const [deletedUsers, setDeletedUsers] = useState([] as ClerkUserObject[]);

	useEffect(() => {
		async function getCurrentUsers() {
			if (userId) {
				let fetchIds = userIds;
				if (userIds.length === 1 && !userIds[0]) {
					fetchIds = [userId];
				}
				const response = await fetch(`/api/user?userIds=${fetchIds.join(",")}`);
				if (response.ok) {
					const json = (await response.json()) as NetworkPacket;
					if (json.statusMessage === "success") {
						setUsers(json.result);
						if (!submittable) {
							setUserIds(json.result.map((u: ClerkUserObject) => u.id));
						}
					} else if (json.statusMessage === "error") {
						setLoadingError(json.error);
					}
				} else {
					setLoadingError(response.statusText);
					setSearchedUsers([]);
				}
			}
		}

		getCurrentUsers();
	}, [userId, setUserIds, submittable, userIds]);

	useEffect(() => {
		if (!submittable && users.length) {
			const currUserIds = users.reduce((acc, u) => {
				if (!deletedUsers.some((nu) => u.id === nu.id)) {
					acc.push(u.id);
				}

				return acc;
			}, [] as string[]);

			setUserIds([...currUserIds, ...newUsers.map((u) => u.id)]);
		}
	}, [newUsers, deletedUsers, setUserIds, submittable, users]);

	async function searchUsers(query = "") {
		if (query) {
			const response = await fetch(`/api/user?query=${query}`);
			if (response.ok) {
				const json = (await response.json()) as NetworkPacket;
				if (json.statusMessage === "success") {
					setSearchedUsers(json.result);
				} else if (json.statusMessage === "error") {
					setSearchedUsers([]);
					setLoadingError(json.error);
				}
			} else {
				setLoadingError(response.statusText);
				setSearchedUsers([]);
			}
		} else {
			setSearchedUsers([]);
		}
	}

	const handleSearch = useDebouncedCallback(searchUsers, 300);

	async function handleSubmit() {
		if (submittable && (deletedUsers.length || newUsers.length)) {
			setSubmitError("");

			const result = await submitAction(
				target,
				newUsers.map((u) => u.id),
				deletedUsers.map((u) => u.id)
			);
			if (result.statusMessage === "success") {
				setUsers([...users.filter((u) => !deletedUsers.some((nu) => u.id === nu.id)), ...newUsers]);

				setSearch("");
				setNewUsers([]);
				setDeletedUsers([]);
				setSubmitError("");

				if (afterSubmit) {
					afterSubmit();
				}
			} else if (result.statusMessage === "error") {
				setSubmitError(result.error);
			}
		}
	}

	if (loadingError) {
		return <>{loadingError}</>;
	}

	return (
		<div className="w-full">
			<div className="flex flex-col gap-3">
				<div className="dropdown">
					<fieldset className="fieldset">
						<legend className="fieldset-legend text-sm text-base-content/80 font-normal">Search for users</legend>
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
							disabled={disabled}
						/>
					</fieldset>
					{!!searchedUsers.filter((u) => !users.some((nu) => u.id === nu.id) && !newUsers.some((nu) => u.id === nu.id))
						.length && (
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
													<UserDisplay user={u} parentDisabled={disabled} />
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

				{submittable && (
					<button className="btn" disabled={!deletedUsers.length && !newUsers.length} onClick={handleSubmit}>
						Update Users
					</button>
				)}
				{!!submitError && <div>Error: {submitError}</div>}
			</div>

			<div>
				<div className="mt-4 text-sm text-base-content/80 font-normal py-1 mb-1">Current Users:</div>
				<div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
					{users.map((u) => (
						<div key={u.id} className="inline-flex items-center gap-2 p-1 border-2 border-primary rounded-lg">
							<UserDisplay
								user={u}
								disabled={deletedUsers.some((nu) => u.id === nu.id)}
								parentDisabled={disabled}
								deletable={u.id !== userId}
								onDelete={() => setDeletedUsers([...deletedUsers, u])}
								onAdd={() => setDeletedUsers(deletedUsers.filter((nu) => u.id !== nu.id))}
							/>
						</div>
					))}
					{newUsers.map((u) => (
						<div key={u.id} className="inline-flex items-center gap-2 p-1 border-2 border-secondary rounded-lg">
							<UserDisplay
								user={u}
								deletable
								parentDisabled={disabled}
								onDelete={() => setNewUsers(newUsers.filter((nu) => u.id !== nu.id))}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function UserDisplay({
	user,
	disabled,
	parentDisabled,
	deletable,
	onDelete,
	onAdd
}: {
	user: ClerkUserObject;
	disabled?: boolean;
	parentDisabled?: boolean;
	deletable?: boolean;
	onDelete?: MouseEventHandler<HTMLButtonElement>;
	onAdd?: MouseEventHandler<HTMLButtonElement>;
}) {
	return (
		<>
			<div className={`relative h-5 aspect-square ${disabled ? "opacity-25" : ""}`}>
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
			{deletable &&
				(disabled ? (
					<button
						className="btn btn-xs h-5 w-5 btn-circle btn-ghost text-success"
						onClick={onAdd}
						disabled={parentDisabled}
					>
						✓
					</button>
				) : (
					<button
						className="btn btn-xs h-5 w-5 btn-circle btn-ghost text-red-400"
						onClick={onDelete}
						disabled={parentDisabled}
					>
						✕
					</button>
				))}
		</>
	);
}
