"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { Prisma } from "../generated/prisma/client";

export default function Search() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();
	const searchRef = useRef<HTMLInputElement>(null);
	const [searchType, setSearchType] = useState("All Tables");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const search = formData.get("searchInput") as string;

		const params = new URLSearchParams(searchParams);
		if (search) {
			params.set("q", search);
		} else {
			params.delete("q");
		}
		replace(`${pathname}?${params.toString()}`);
	}

	return (
		<div className="relative flex flex-1 flex-shrink-0">
			<form
				onSubmit={handleSubmit}
				className="input input-bordered bg-neutral-content w-full grid grid-cols-[15%_80%_5%] p-0"
			>
				<div className="dropdown dropdown-hover grow h-full">
					<div tabIndex={0} role="button" className="btn btn-sm btn-ghost w-full h-full">
						{searchType} ▼
					</div>
					<ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
						<li>
							<a
								onClick={() => {
									setSearchType("All Tables");
									if (searchRef.current) {
										searchRef.current.focus();
									}
								}}
							>
								All Tables
							</a>
						</li>
						{Object.keys(Prisma.ModelName)
							.sort()
							.map((type) => (
								<li key={type}>
									<a
										onClick={() => {
											setSearchType(type);
											if (searchRef.current) {
												searchRef.current.focus();
											}
										}}
									>
										{type}
									</a>
								</li>
							))}
					</ul>
				</div>
				<input
					id="searchInput"
					name="searchInput"
					ref={searchRef}
					type="text"
					className="grow"
					placeholder={`Search ${searchType}...`}
					defaultValue={searchParams.get("q")?.toString()}
				/>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
					<path
						fillRule="evenodd"
						d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
						clipRule="evenodd"
					/>
				</svg>
			</form>
		</div>
	);
}
