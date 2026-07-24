'use client';

import { useState } from 'react';

type CopyButtonProps = {
	taxonomy?: string;
	value?: string;
	variant?: 'text' | 'icon';
	title?: string;
	ariaLabel?: string;
	className?: string;
};

export default function CopyButton({
	taxonomy,
	value,
	variant = 'text',
	title,
	ariaLabel,
	className = ''
}: CopyButtonProps) {
	const [copied, setCopied] = useState(false);
	const textToCopy = value ?? taxonomy ?? '';

	if (!textToCopy) return null;

	const handleCopy = () => {
		try {
			navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	if (variant === 'icon') {
		return (
			<button
				onClick={handleCopy}
				type="button"
				title={copied ? 'Copied' : (title ?? 'Copy')}
				aria-label={ariaLabel ?? 'Copy'}
				className={[
					'btn btn-ghost btn-sm btn-square text-base-content/70 hover:text-base-content',
					copied ? 'text-success' : '',
					className
				]
					.filter(Boolean)
					.join(' ')}
			>
				{copied ? (
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
				) : (
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</svg>
				)}
			</button>
		);
	}

	return (
		<button
			onClick={handleCopy}
			className={[
				'text-xs text-primary hover:text-primary-focus transition-colors cursor-pointer text-center min-w-24',
				className
			]
				.filter(Boolean)
				.join(' ')}
			title={title ?? 'Copy full taxonomy'}
			type="button"
		>
			{copied ? 'Copied!' : 'Copy full taxonomy'}
		</button>
	);
}

