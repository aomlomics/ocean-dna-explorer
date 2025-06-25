"use client";

import { MouseEventHandler } from "react";
import Image from "next/image";
import { ClerkUserObject } from "@/types/globals";

export default function UserDisplay({
	user,
	disabled,
	deletable,
	onDelete,
	onAdd
}: {
	user: ClerkUserObject;
	disabled?: boolean;
	deletable?: boolean;
	onDelete?: MouseEventHandler<HTMLButtonElement>;
	onAdd?: MouseEventHandler<HTMLButtonElement>;
}) {
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
			{deletable &&
				(disabled ? (
					<button className="btn btn-xs h-[20px] w-[20px] btn-circle btn-ghost text-success" onClick={onAdd}>
						✓
					</button>
				) : (
					<button className="btn btn-xs h-[20px] w-[20px] btn-circle btn-ghost text-red-400" onClick={onDelete}>
						✕
					</button>
				))}
		</>
	);
}
