"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			{children}
			<ProgressBar
				height="4px"
				color="#64abdc"
				options={{ showSpinner: false }}
				shallowRouting
				delay={300}
			/>
		</>
	);
};

export default Providers;
