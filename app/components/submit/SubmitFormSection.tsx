import { ReactNode } from "react";
import InfoButton from "../InfoButton";

export default function SubmitFormSection({
	children,
	title,
	info,
	className
}: {
	children?: ReactNode;
	title: string;
	info?: string;
	className?: string;
}) {
	return (
		<div className="flex flex-col items-center w-full">
			<div className="flex gap-2 justify-center w-full border-t-2 border-primary py-4">
				<div className="text-primary text-xl">{title}</div>
				{info && <InfoButton infoText={info} />}
			</div>

			<div className={className}>{children}</div>
		</div>
	);
}
