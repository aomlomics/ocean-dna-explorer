import type { ReactNode } from "react";

export default function MapWrapper({
	children,
	loading,
	className
}: {
	children: ReactNode;
	loading: boolean;
	className?: string;
}) {
	return (
		<div
			className={`overflow-hidden [:where(&)]:bg-base-200 [:where(&)]:aspect-video [:where(&)]:rounded-lg ${className ?? ""}`}
		>
			{loading ? (
				<div className="w-full h-full flex justify-center items-center">
					<div className="h-full aspect-square p-50">
						<span className="loading loading-spinner loading-xl h-full w-full" />
					</div>
				</div>
			) : (
				<>{children}</>
			)}
		</div>
	);
}
