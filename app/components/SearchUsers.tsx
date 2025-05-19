"use client";

import { usePathname, useRouter } from "next/navigation";
import { FormEvent } from "react";

export function SearchUsers() {
	const router = useRouter();
	const pathname = usePathname();

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const queryTerm = formData.get("search") as string;
		router.push(pathname + "?search=" + queryTerm);
	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Search for users</legend>
					<input type="text" name="search" className="input" placeholder="Search" />
				</fieldset>
				<button className="btn" type="submit">
					Submit
				</button>
				<button className="btn" type="reset" onClick={() => router.push(pathname)}>
					Clear
				</button>
			</form>
		</div>
	);
}
