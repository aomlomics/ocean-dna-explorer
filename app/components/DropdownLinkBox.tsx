import Link from "next/link";

export default function DropdownLinkBox({
	title,
	count,
	content,
	linkPrefix
}: {
	title: string;
	count?: number;
	content: string[];
	linkPrefix: string;
}) {
	return (
		<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300">
			<div tabIndex={0} role="button" className="stat focus:bg-base-300 w-full p-6 flex justify-between items-center">
				<div>
					<div className="text-lg font-medium text-base-content/70">{title}</div>
					{!!count && <div className="text-2xl font-medium mt-1">{count}</div>}
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-base-content/70"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</div>
			<ul
				tabIndex={0}
				className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-[1] p-2 shadow"
			>
				{content.map((str) => (
					<li key={str}>
						<Link href={`${linkPrefix}/${str}`} className="text-base-content hover:text-primary break-all">
							{str}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
