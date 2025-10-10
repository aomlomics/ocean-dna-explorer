import Link from "next/link";
import StatIcon from "../icons/StatIcon";

type ProjectStatCardProps = {
	title: string;
	value: number;
	href?: string;
	icon: "ship" | "location" | "fish" | "eye" | "analysis";
};

export default function ProjectStatCard({ title, value, href, icon }: ProjectStatCardProps) {
	const content = (
		<div className="group flex flex-col items-center text-center p-2 rounded-lg hover:bg-base-200 transition-all duration-300 hover:scale-105">
			<div className="w-16 h-16 mb-2 flex items-center justify-center text-primary">
				<StatIcon icon={icon} />
			</div>
			<div className="text-3xl font-bold text-primary mb-1 group-hover:text-primary-focus transition-colors">
				{value.toLocaleString()}
			</div>
			<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">{title}</div>
		</div>
	);

	if (href) {
		return <Link href={href}>{content}</Link>;
	}

	return content;
} 