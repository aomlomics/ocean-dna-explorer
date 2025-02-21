"use client";

type SubmissionStatusModalProps = {
	isOpen: boolean;
	isError: boolean;
	message: string;
};

export default function SubmissionStatusModal({ isOpen, isError, message }: SubmissionStatusModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 text-center">
				<h3 className={`text-lg font-bold mb-2 ${isError ? "text-error" : "text-success"}`}>
					{isError ? "Submission Failed" : "Project Submitted Successfully"}
				</h3>
				<p className="mb-2 font-light">{message}</p>
				{!isError && (
					<div className="mt-4 flex items-center justify-center gap-2">
						<span className="loading loading-spinner loading-sm"></span>
						<span className="text-base-content/80 text-sm">Redirecting...</span>
					</div>
				)}
			</div>
		</div>
	);
}
