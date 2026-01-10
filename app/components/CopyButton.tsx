'use client';

import { useState } from 'react';

export default function CopyButton({ taxonomy }: { taxonomy: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		try {
			navigator.clipboard.writeText(taxonomy);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	return (
		<button
			onClick={handleCopy}
			className="text-xs text-primary hover:text-primary-focus transition-colors cursor-pointer text-center min-w-[90px]"
			title="Copy full taxonomy"
			type="button"
		>
			{copied ? 'Copied!' : 'Copy full taxonomy'}
		</button>
	);
}

