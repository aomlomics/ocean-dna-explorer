import { ReactNode } from "react";
import { Metadata } from "next";
import DocsLayoutContainer from "../components/docs/DocsLayoutContainer";

export const metadata: Metadata = {
	title: {
		default: "Documentation",
		template: "%s | ODE Docs"
	}
};

export default function DocsLayout({ children }: { children: ReactNode }) {
	return <DocsLayoutContainer>{children}</DocsLayoutContainer>;
}
