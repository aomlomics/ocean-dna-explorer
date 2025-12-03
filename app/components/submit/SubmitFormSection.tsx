import { ReactNode } from "react";
import InfoButton from "../InfoButton";

export default function SubmitFormSection({
	children,
	title,
	info,
	className = ""
}: {
	children?: ReactNode;
	title: string;
	info?: string;
	className?: string;
}) {
	return (
		<div className="flex flex-col w-full">
			<div className="flex gap-2 items-start w-full py-1 mb-1">
				<div className="text-base-content/80 text-base font-normal">{title}</div>
				<div className="object-center mt-0.5">{info && <InfoButton infoText={info} />}</div>
			</div>

			<div className={className}>{children}</div>
		</div>
	);
}
