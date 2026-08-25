import ContributeForm from "@/app/components/ContributeForm";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Apply to Contribute",
	description: "Apply to contribute to Ocean DNA Explorer. Help make marine biodiversity data more FAIR."
};

export default async function Contribute() {
	await auth.protect();

	return <ContributeForm />;
}
