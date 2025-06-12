export default function Filter({
	children,
	fieldName,
	value
}: {
	children: React.ReactNode;
	fieldName: string;
	value: string;
}) {
	return (
		<div key={fieldName} className="collapse collapse-arrow bg-base-100">
			<input type="checkbox" className="collapse-toggle" />
			<div className="collapse-title">
				<div className="flex flex-col items-start gap-1">
					<span className="font-medium text-base-content">{fieldName}</span>
					<span className="text-sm text-base-content/70 break-all">{value}</span>
				</div>
			</div>
			<div className="collapse-content bg-base-200/30 pt-0 !pb-0">{children}</div>
		</div>
	);
}
