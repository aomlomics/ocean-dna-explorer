"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function Search({ placeholder }: { placeholder: string }) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { replace } = useRouter();
	const searchRef = useRef<HTMLInputElement>(null);
	//const [searchSuggs, setSearchSuggs] = useState([] as Array<{}>);
	const [searchFieldSuggs, setSearchFieldSuggs] = useState([] as Array<string>);
	const [searchType, setSearchType] = useState("Samples");

	const testArr = [
		{ title: "1", description: "The number 1" },
		{ title: "2", description: "The number 2" },
		{ title: "3", description: "The number 3" },
		{ title: "4", description: "The number 4" },
		{ title: "5", description: "The number 5" }
	];

	const handleSearch = useDebouncedCallback((search) => {
		const params = new URLSearchParams(searchParams);
		if (search) {
			params.set("q", search);

			const splitSearch = search.match(/\w+/g); //match on any word (\w+) with an optional trailing colon (:?)
			//set to array of keys that match entire search
			setSearchFieldSuggs(
				Object.keys(testArr[0]).filter((e) =>
					e.toLowerCase().includes(splitSearch[splitSearch.length - 1].toLowerCase())
				)
			);
			//set to array of objects where any value in the object matches the entire search
			//setSearchSuggs(testArr.filter((e) => {
			//	return Object.values(e).filter((e2) => e2.toLowerCase().includes(search.toLowerCase())).length;
			//}));
		} else {
			params.delete("q");

			setSearchFieldSuggs([]);
			//setSearchSuggs([]);
		}
		replace(`${pathname}?${params.toString()}`);
	}, 300);

	function suggClick(e: React.MouseEvent) {
		const params = new URLSearchParams(searchParams);

		//replace the last word with the clicked on suggestion
		let splitSearch = params.get("q")!.match(/\w+:?/g)!; //match on any word (\w+) with an optional trailing colon (:?). ! to assert existence since we know they both exist, otherwise the div wouldn't exist
		const lastLen = splitSearch[splitSearch.length - 1].length;
		const newVal = params.get("q")!.trim().slice(0, -lastLen) + (e.target as HTMLElement).innerText + " ";
		params.set("q", newVal); //TS can't detect the type of e.target properly, so we assert it inline
		replace(`${pathname}?${params.toString()}`);

		const inp = document.getElementById("searchInput")! as HTMLInputElement;
		inp.focus();
		inp.value = newVal;

		setSearchFieldSuggs([]);
	}

	return (
		<div className="relative flex flex-1 flex-shrink-0">
			<label className="input input-bordered flex items-center gap-2 bg-neutral-content w-full">
				<div className="dropdown dropdown-hover">
					<div tabIndex={0} role="button" className="btn btn-sm btn-ghost m-1">
						{searchType} ▼
					</div>
					<ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
						{["Projects", "Samples", "Sequences", "Occurences", "Assays"].map((type) => (
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
					ref={searchRef}
					type="text"
					className="grow"
					placeholder={`Search ${searchType}...`}
					onChange={(e) => {
						handleSearch(e.target.value);
					}}
					defaultValue={searchParams.get("q")?.toString()}
				/>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
					<path
						fillRule="evenodd"
						d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
						clipRule="evenodd"
					/>
				</svg>
			</label>
			{/*{(searchFieldSuggs.length > 0 || searchSuggs.length > 0) &&*/}
			{searchFieldSuggs.length > 0 && (
				<div className="absolute top-full inset-x-0 z-[10000] bg-neutral-content px-3 py-3 rounded-lg mt-1 flex flex-col">
					{searchFieldSuggs.map((s, i) => (
						<div
							key={i}
							onClick={suggClick}
							className="cursor-pointer hover:bg-neutral active:bg-neutral px-3 py-1 rounded-lg"
						>
							{s}:
						</div>
					))}
					{/*{searchSuggs.map((s, i) => (
						<div key={i} className="cursor-pointer hover:bg-neutral active:bg-neutral px-3 py-1 rounded-lg">{s.title}</div>
					))}*/}
				</div>
			)}
		</div>
	);
}
