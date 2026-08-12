export default function Filter({ children, fieldName }: { children: React.ReactNode; fieldName: string }) {
	return (
		<div key={fieldName} className="collapse collapse-arrow bg-base-100">
			<input type="checkbox" className="collapse-toggle" />
			<div className="collapse-title">
				<span className="font-medium text-base-content">{fieldName}</span>
			</div>
			<div className="collapse-content bg-base-200/30 pt-0 pb-0!">{children}</div>
		</div>
	);
}
