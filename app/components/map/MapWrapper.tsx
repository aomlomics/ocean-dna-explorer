import type { ReactNode } from "react";

/**
 * A wrapper for using {@link app/components/map/DynamicMap.default | DynamicMap} directly. Has the same styling as the
 * wrapper and Suspense in {@link app/components/map/Map.default | Map}.
 */
export default function MapWrapper({
	children,
	loading,
	className
}: {
	/** The child components. Should only ever be {@link app/components/map/DynamicMap.default | DynamicMap}. */
	children: ReactNode;
	/** Whether to display the loading state. */
	loading: boolean;
	/** Styling for the div that wraps the children. */
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
