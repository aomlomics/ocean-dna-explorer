"use client";

import chroma from "chroma-js";
import { ReactNode, SetStateAction, useState } from "react";

export default function Checklist({
	label,
	list,
	colorList,
	listFilter,
	setListFilter,
	sideEffect,
	extraLists,
	className,
	buttonClassName
}: {
	label: string;
	list: string[];
	colorList?: chroma.Color[];
	listFilter: Record<string, true>;
	setListFilter: (value: SetStateAction<Record<string, true>>) => void;
	sideEffect?: () => void;
	extraLists?: { list: string[]; label: string }[];
	className?: string;
	buttonClassName?: string;
}) {
	const [search, setSearch] = useState("");

	return (
		<div className={`dropdown dropdown-end${className ? " " + className : ""}`}>
			<div tabIndex={0} role="button" className={`btn${buttonClassName ? " " + buttonClassName : ""}`}>
				{list.length - Object.keys(listFilter).length}/{list.length} {label}
			</div>
			{/* Dropdown */}
			<div tabIndex={0} className="dropdown-content z-50 w-64 shadow-lg overflow-x-hidden">
				<div className="bg-base-100 border border-base-300 rounded-box overflow-hidden">
					{/* Header: All toggle + search */}
					<div className="sticky top-0 bg-base-200 border-b border-base-300 p-2">
						<div className="form-control flex-row items-center w-full gap-2 min-w-0">
							<label className="label cursor-pointer justify-start gap-2 m-0 p-0">
								<input
									type="checkbox"
									onChange={(e) => {
										if (e.target.checked) {
											setListFilter({});
										} else {
											setListFilter(
												list.reduce((acc: Record<string, true>, head) => {
													if (!listFilter[head]) {
														return { ...acc, [head]: true };
													} else {
														return { ...acc };
													}
												}, {})
											);
										}

										if (sideEffect) {
											sideEffect();
										}
									}}
									checked={!Object.values(listFilter).some((bool) => bool)}
									className="checkbox checkbox-xs"
								/>
								<span className="label-text text-sm">All</span>
							</label>
							<input
								type="text"
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Filter columns"
								className="input input-bordered input-xs w-full flex-1 min-w-0"
							/>
						</div>
					</div>

					{/* Body: column list */}
					<ul className="bg-base-100 max-h-64 overflow-y-auto overflow-x-hidden p-2 pt-1 w-full flex flex-col gap-1">
						{list.reduce((acc: ReactNode[], head, i) => {
							//only render the header name if it is selected in the header name filter
							if (head.toLowerCase().includes(search.toLowerCase())) {
								const extraLabel = extraLists?.find((e) => e.list.includes(head))?.label;

								acc.push(
									<li key={head + "_dropdown" + i}>
										<label className="flex items-center cursor-pointer p-2 hover:bg-base-200 rounded w-full gap-2 min-w-0">
											<input
												type="checkbox"
												checked={!listFilter[head]}
												onChange={() => {
													const temp = { ...listFilter };
													if (listFilter[head]) {
														delete temp[head];
													} else {
														temp[head] = true;
													}
													setListFilter(temp);

													if (sideEffect) {
														sideEffect();
													}
												}}
												className="checkbox checkbox-xs"
											/>

											<span className="text-sm pl-2 truncate max-w-full">
												{head} {extraLabel && <sup className="text-xs">{extraLabel}</sup>}
											</span>

											{colorList ? (
												<div
													className="aspect-square w-[1em] h-[1em]"
													style={{ backgroundColor: colorList[i].hex() }}
												></div>
											) : (
												<></>
											)}
										</label>
									</li>
								);
							}

							return acc;
						}, [])}
					</ul>
				</div>
			</div>
		</div>
	);
}
