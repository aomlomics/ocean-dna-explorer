"use client";

import type chroma from "chroma-js";
import { type ReactNode, type SetStateAction, type TransitionStartFunction, useState } from "react";

export default function Checklist({
	label,
	list,
	colorList,
	listFilter,
	setListFilter,
	defaultListFilter = {},
	startTransition,
	extraLists,
	className,
	buttonClassName,
	disabled
}: {
	label: string;
	list: string[];
	colorList?: chroma.Color[];
	listFilter: Record<string, boolean>;
	setListFilter: (value: SetStateAction<Record<string, boolean>>) => void;
	defaultListFilter?: Record<string, true>;
	startTransition?: TransitionStartFunction;
	extraLists?: { list: string[]; label: string }[];
	className?: string;
	buttonClassName?: string;
	disabled?: boolean;
}) {
	const [search, setSearch] = useState("");

	function isHidden(item: string) {
		if (listFilter[item] !== undefined) {
			return listFilter[item];
		}

		return !!defaultListFilter[item];
	}

	return (
		<div className={`dropdown dropdown-end ${className ?? ""}`}>
			<button tabIndex={0} className={`btn text-nowrap ${buttonClassName}`} disabled={disabled}>
				{list.filter((item) => !isHidden(item)).length}/{list.length} {label}
			</button>

			<div tabIndex={0} className="dropdown-content z-50 w-64 shadow-lg overflow-x-hidden">
				<div className="bg-base-100 border border-base-300 rounded-box overflow-hidden">
					<div className="sticky top-0 bg-base-200 border-b border-base-300 p-2">
						<div className="form-control flex-row items-center w-full gap-2 min-w-0">
							<label className="label cursor-pointer justify-start gap-2 m-0 p-0">
								<input
									type="checkbox"
									onChange={(e) => {
										const checked = e.target.checked;

										function func() {
											const temp = { ...listFilter };
											for (const item of list) {
												temp[item] = !checked;
											}
											setListFilter(temp);
										}

										if (startTransition) {
											startTransition(func);
										} else {
											func();
										}
									}}
									checked={list.every((item) => !isHidden(item))}
									className="checkbox checkbox-xs"
								/>
								<span className="label-text text-sm select-none">All</span>
							</label>
							<input
								type="text"
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Filter columns"
								className="input input-bordered input-xs w-full flex-1 min-w-0"
							/>
						</div>
					</div>

					<ul className="bg-base-100 max-h-64 overflow-y-auto overflow-x-hidden p-2 pt-1 w-full flex flex-col gap-1">
						{list.reduce((acc: ReactNode[], head, i) => {
							if (head.toLowerCase().includes(search.toLowerCase())) {
								const extraLabel = extraLists?.find((e) => e.list.includes(head))?.label;

								acc.push(
									<li key={head + "_dropdown" + i}>
										<label className="flex items-center cursor-pointer p-2 hover:bg-base-200 rounded w-full gap-2 min-w-0">
											<input
												type="checkbox"
												checked={!isHidden(head)}
												onChange={(e) => {
													const checked = e.target.checked;

													function func() {
														const temp = { ...listFilter };
														temp[head] = !checked;
														setListFilter(temp);
													}

													if (startTransition) {
														startTransition(func);
													} else {
														func();
													}
												}}
												className="checkbox checkbox-xs"
											/>

											<span className="text-sm pl-2 truncate max-w-full select-none">
												{head} {extraLabel && <sup className="text-xs">{extraLabel}</sup>}
											</span>

											{colorList ? (
												<div
													className="aspect-square w-[1em] h-[1em]"
													style={{ backgroundColor: colorList[i]!.hex() }}
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
