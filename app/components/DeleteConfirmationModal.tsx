"use client";

type DeleteConfirmModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	projectId: string;
	associatedAnalyses: { analysis_run_name: string }[];
};

export default function DeleteConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	projectId,
	associatedAnalyses
}: DeleteConfirmModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 text-center text-md text-base-content">
				<h3 className="text-2xl font-bold text-primary mb-2">Confirm Deletion</h3>
				<p className="mb-2 text-md text-base-content">
					Are you sure you want to delete project <span className="text-md text-base-content">{projectId}</span>?
				</p>
				{associatedAnalyses.length > 0 && (
					<div className="mb-2">
						<p className="text-md text-base-content">This will also delete the following analyses:</p>
						<ul className="list-disc list-inside space-y-1 bg-base-100 p-3 rounded-lg">
							{associatedAnalyses.map((analysis) => (
								<li key={analysis.analysis_run_name} className="text-md text-base-content">
									{analysis.analysis_run_name}
								</li>
							))}
						</ul>
					</div>
				)}
				<div className="flex justify-center gap-3 mt-6">
					<button onClick={onClose} className="btn btn-base-200">
						Cancel
					</button>
					<button onClick={onConfirm} className="btn bg-primary text-error-content hover:bg-error">
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
